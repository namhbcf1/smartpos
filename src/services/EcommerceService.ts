/**
 * E-commerce Service for SmartPOS Online Ordering
 */

import { Env } from '../types';
import { DatabaseExecutor } from '../utils/database';
import { cache, CacheConfigs } from '../utils/cache';

export interface OnlineProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: string;
  tags: string[];
  isAvailable: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>; // size, color, etc.
}

export interface OnlineOrder {
  id: number;
  orderNumber: string;
  customerId?: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: OnlineOrderItem[];
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cod' | 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  deliveryTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnlineOrderItem {
  id: number;
  productId: number;
  variantId?: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface ShippingZone {
  id: number;
  name: string;
  areas: string[];
  fee: number;
  freeShippingThreshold?: number;
  estimatedDays: number;
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: 'momo' | 'vnpay' | 'zalopay' | 'bank_transfer';
  isEnabled: boolean;
  config: Record<string, string>;
}

export class EcommerceService {
  private executor: DatabaseExecutor;

  constructor(private env: Env) {
    this.executor = new DatabaseExecutor(env);
  }

  /**
   * Get online product catalog
   */
  async getOnlineProducts(filters: {
    category_id?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    sortBy?: 'name' | 'price' | 'rating' | 'newest';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<{ products: OnlineProduct[]; total: number }> {
    const cacheKey = `online_products:${JSON.stringify(filters)}`;
    const cached = await cache.get(this.env, cacheKey, CacheConfigs.PRODUCTS);
    
    if (cached) {
      return cached;
    }

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.sale_price,
        p.stock,
        p.images,
        c.name as category,
        p.tags,
        p.is_active,
        COALESCE(AVG(r.rating), 0) as rating,
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_reviews r ON p.id = r.product_id
      WHERE p.is_active = 1 AND p.is_online = 1
    `;

    const bindings: any[] = [];

    // Apply filters
    if (filters.category_id) {
      query += ' AND p.category_id = ?';
      bindings.push(filters.category_id);
    }

    if (filters.search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      bindings.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.minPrice) {
      query += ' AND p.price >= ?';
      bindings.push(filters.minPrice);
    }

    if (filters.maxPrice) {
      query += ' AND p.price <= ?';
      bindings.push(filters.maxPrice);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => 'p.tags LIKE ?').join(' OR ');
      query += ` AND (${tagConditions})`;
      filters.tags.forEach(tag => bindings.push(`%${tag}%`));
    }

    query += ' GROUP BY p.id';

    // Apply sorting
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    
    switch (sortBy) {
      case 'price':
        query += ` ORDER BY p.price ${sortOrder.toUpperCase()}`;
        break;
      case 'rating':
        query += ` ORDER BY rating ${sortOrder.toUpperCase()}`;
        break;
      case 'newest':
        query += ` ORDER BY p.created_at ${sortOrder.toUpperCase()}`;
        break;
      default:
        query += ` ORDER BY p.name ${sortOrder.toUpperCase()}`;
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;
    
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const result = await this.executor.execute(query, bindings);
    const products = (result.data || []).map(this.formatOnlineProduct);

    // Get total count
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(DISTINCT p.id) as total FROM').replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '');
    const countResult = await this.executor.execute(countQuery, bindings);
    const total = countResult.data?.[0]?.total || 0;

    const response = { products, total };
    
    // Cache for 30 minutes
    await cache.set(this.env, cacheKey, response, CacheConfigs.PRODUCTS);
    
    return response;
  }

  /**
   * Get single online product with variants
   */
  async getOnlineProduct(productId: number): Promise<OnlineProduct | null> {
    const cacheKey = `online_product:${productId}`;
    const cached = await cache.get(this.env, cacheKey, CacheConfigs.PRODUCTS);
    
    if (cached) {
      return cached;
    }

    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.sale_price,
        p.stock,
        p.images,
        c.name as category,
        p.tags,
        p.is_active,
        COALESCE(AVG(r.rating), 0) as rating,
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_reviews r ON p.id = r.product_id
      WHERE p.id = ? AND p.is_active = 1 AND p.is_online = 1
      GROUP BY p.id
    `;

    const result = await this.executor.execute(query, [productId]);
    
    if (!result.data || result.data.length === 0) {
      return null;
    }

    const product = this.formatOnlineProduct(result.data[0]);

    // Get variants if any
    const variantsQuery = `
      SELECT id, name, price, stock, attributes
      FROM product_variants
      WHERE product_id = ? AND is_active = 1
    `;
    
    const variantsResult = await this.executor.execute(variantsQuery, [productId]);
    
    if (variantsResult.data && variantsResult.data.length > 0) {
      product.variants = variantsResult.data.map((variant: any) => ({
        ...variant,
        attributes: JSON.parse(variant.attributes || '{}'),
      }));
    }

    // Cache for 1 hour
    await cache.set(this.env, cacheKey, product, CacheConfigs.PRODUCTS);
    
    return product;
  }

  /**
   * Create online order
   */
  async createOnlineOrder(orderData: {
    customerId?: number;
    customerInfo: OnlineOrder['customerInfo'];
    items: Array<{
      productId: number;
      variantId?: number;
      quantity: number;
      notes?: string;
    }>;
    deliveryType: 'pickup' | 'delivery';
    deliveryAddress?: string;
    deliveryTime?: string;
    paymentMethod: OnlineOrder['paymentMethod'];
    notes?: string;
    couponCode?: string;
  }): Promise<OnlineOrder> {
    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems: OnlineOrderItem[] = [];

    for (const item of orderData.items) {
      const product = await this.getOnlineProduct(item.productId);
      if (!product || !product.isAvailable) {
        throw new Error(`Product ${item.productId} is not available`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      let price = product.price;
      let name = product.name;

      // Handle variants
      if (item.variantId && product.variants) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found`);
        }
        if ((variant as any).stock < item.quantity) {
          throw new Error(`Insufficient stock for variant ${variant.name}`);
        }
        price = variant.price;
        name = `${product.name} - ${variant.name}`;
      }

      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        id: 0, // Will be set after insert
        productId: item.productId,
        variantId: item.variantId,
        name,
        price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        notes: item.notes,
      });
    }

    // Calculate shipping
    const shippingFee = await this.calculateShippingFee(
      orderData.deliveryType,
      orderData.deliveryAddress,
      subtotal
    );

    // Apply discount if coupon provided
    let discountAmount = 0;
    if (orderData.couponCode) {
      discountAmount = await this.applyCoupon(orderData.couponCode, subtotal);
    }

    // Calculate tax (10%)
    const taxableAmount = subtotal + shippingFee - discountAmount;
    const taxAmount = taxableAmount * 0.1;

    const total = taxableAmount + taxAmount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const orderQuery = `
      INSERT INTO online_orders (
        order_number, customer_id, customer_name, customer_email, customer_phone, customer_address,
        subtotal, shipping_fee, tax_amount, discount_amount, total,
        payment_method, payment_status, order_status,
        delivery_type, delivery_address, delivery_time, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const orderResult = await this.executor.execute(orderQuery, [
      orderNumber,
      orderData.customerId || null,
      orderData.customerInfo.name,
      orderData.customerInfo.email,
      orderData.customerInfo.phone,
      orderData.customerInfo.address,
      subtotal,
      shippingFee,
      taxAmount,
      discountAmount,
      total,
      orderData.paymentMethod,
      'pending',
      'pending',
      orderData.deliveryType,
      orderData.deliveryAddress,
      orderData.deliveryTime,
      orderData.notes,
    ]);

    const orderId = orderResult.meta?.lastRowId;
    if (!orderId) {
      throw new Error('Failed to create order');
    }

    // Create order items
    for (const item of orderItems) {
      const itemQuery = `
        INSERT INTO online_order_items (
          order_id, product_id, variant_id, name, price, quantity, subtotal, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.executor.execute(itemQuery, [
        orderId,
        item.productId,
        item.variantId || null,
        item.name,
        item.price,
        item.quantity,
        item.subtotal,
        item.notes || null,
      ]);

      // Update stock
      if (item.variantId) {
        await this.executor.execute(
          'UPDATE product_variants SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.variantId]
        );
      } else {
        await this.executor.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      }
    }

    // Return created order
    return this.getOnlineOrder(orderId);
  }

  /**
   * Get online order by ID
   */
  async getOnlineOrder(orderId: number): Promise<OnlineOrder> {
    const orderQuery = `
      SELECT * FROM online_orders WHERE id = ?
    `;

    const orderResult = await this.executor.execute(orderQuery, [orderId]);
    
    if (!orderResult.data || orderResult.data.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.data[0];

    // Get order items
    const itemsQuery = `
      SELECT * FROM online_order_items WHERE order_id = ?
    `;

    const itemsResult = await this.executor.execute(itemsQuery, [orderId]);

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customerInfo: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.customer_address,
      },
      items: itemsResult.data || [],
      subtotal: order.subtotal,
      shippingFee: order.shipping_fee,
      taxAmount: order.tax_amount,
      discountAmount: order.discount_amount,
      total: order.total,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      deliveryType: order.delivery_type,
      deliveryAddress: order.delivery_address,
      deliveryTime: order.delivery_time,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: number,
    status: OnlineOrder['orderStatus'],
    notes?: string
  ): Promise<void> {
    const query = `
      UPDATE online_orders 
      SET order_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `;

    await this.executor.execute(query, [status, orderId]);

    // Log status change
    const logQuery = `
      INSERT INTO order_status_logs (order_id, status, notes, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `;

    await this.executor.execute(logQuery, [orderId, status, notes || null]);
  }

  /**
   * Process payment
   */
  async processPayment(
    orderId: number,
    paymentData: {
      method: OnlineOrder['paymentMethod'];
      transactionId?: string;
      amount: number;
      gateway?: string;
    }
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Get order
      const order = await this.getOnlineOrder(orderId);
      
      if (order.paymentStatus === 'paid') {
        return { success: false, error: 'Order already paid' };
      }

      if (Math.abs(paymentData.amount - order.total) > 0.01) {
        return { success: false, error: 'Payment amount mismatch' };
      }

      // Process based on payment method
      let result: { success: boolean; transactionId?: string; error?: string };

      switch (paymentData.method) {
        case 'cod':
          result = { success: true, transactionId: `COD_${orderId}_${Date.now()}` };
          break;
        case 'bank_transfer':
          result = await this.processBankTransfer(order, paymentData);
          break;
        case 'momo':
          result = await this.processMoMoPayment(order, paymentData);
          break;
        case 'vnpay':
          result = await this.processVNPayPayment(order, paymentData);
          break;
        case 'zalopay':
          result = await this.processZaloPayPayment(order, paymentData);
          break;
        default:
          result = { success: false, error: 'Unsupported payment method' };
      }

      if (result.success) {
        // Update order payment status
        await this.executor.execute(
          'UPDATE online_orders SET payment_status = ?, payment_transaction_id = ?, updated_at = datetime(\'now\') WHERE id = ?',
          ['paid', result.transactionId, orderId]
        );

        // Update order status to confirmed
        await this.updateOrderStatus(orderId, 'confirmed', 'Payment confirmed');
      }

      return result;
    } catch (error) {
      console.error('Payment processing failed:', error);
      return { success: false, error: (error as any).message };
    }
  }

  // Private helper methods

  private formatOnlineProduct(data: any): OnlineProduct {
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: data.price,
      salePrice: data.sale_price,
      images: JSON.parse(data.images || '[]'),
      category: data.category || '',
      tags: JSON.parse(data.tags || '[]'),
      isAvailable: data.is_active === 1 && data.stock > 0,
      stockQuantity: data.stock,
      rating: parseFloat(data.rating) || 0,
      reviewCount: data.review_count || 0,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countResult = await this.executor.execute(
      'SELECT COUNT(*) as count FROM online_orders WHERE DATE(created_at) = DATE(\'now\')'
    );
    const dailyCount = (countResult.data?.[0]?.count || 0) + 1;
    return `ON${today}${dailyCount.toString().padStart(4, '0')}`;
  }

  private async calculateShippingFee(
    deliveryType: 'pickup' | 'delivery',
    address?: string,
    subtotal?: number
  ): Promise<number> {
    if (deliveryType === 'pickup') {
      return 0;
    }

    // Simple shipping calculation - in production, integrate with shipping providers
    const baseShippingFee = 30000; // 30k VND
    const freeShippingThreshold = 500000; // 500k VND

    if (subtotal && subtotal >= freeShippingThreshold) {
      return 0;
    }

    return baseShippingFee;
  }

  private async applyCoupon(couponCode: string, subtotal: number): Promise<number> {
    const couponQuery = `
      SELECT * FROM coupons 
      WHERE code = ? AND is_active = 1 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    `;

    const couponResult = await this.executor.execute(couponQuery, [couponCode]);
    
    if (!couponResult.data || couponResult.data.length === 0) {
      throw new Error('Invalid or expired coupon');
    }

    const coupon = couponResult.data[0];

    if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
      throw new Error(`Minimum order amount for this coupon is ${coupon.minimum_amount}`);
    }

    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = subtotal * (coupon.discount_value / 100);
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    // Update coupon usage
    await this.executor.execute(
      'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
      [coupon.id]
    );

    return discountAmount;
  }

  // Payment gateway integrations (simplified)
  private async processBankTransfer(order: OnlineOrder, paymentData: any) {
    // In production, integrate with bank APIs
    return { success: true, transactionId: `BANK_${order.id}_${Date.now()}` };
  }

  private async processMoMoPayment(order: OnlineOrder, paymentData: any) {
    // In production, integrate with MoMo API
    return { success: true, transactionId: `MOMO_${order.id}_${Date.now()}` };
  }

  private async processVNPayPayment(order: OnlineOrder, paymentData: any) {
    // In production, integrate with VNPay API
    return { success: true, transactionId: `VNPAY_${order.id}_${Date.now()}` };
  }

  private async processZaloPayPayment(order: OnlineOrder, paymentData: any) {
    // In production, integrate with ZaloPay API
    return { success: true, transactionId: `ZALOPAY_${order.id}_${Date.now()}` };
  }
}