import { Env } from '../types';

export interface CartItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percent?: number;
}

export interface CheckoutData {
  customer_info?: {
    customer_id?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  payment_method: string;
  total_amount: number;
  cart_items: CartItem[];
  discount_percent?: number;
  discount_amount?: number;
  tax_percent?: number;
  notes?: string;
}

export class POSService_POSTsx {
  constructor(private env: Env) {}

  async getCart(tenantId: string, userId: string) {
    try {
      // Cart is stored in KV or session - for simplicity return empty
      return {
        success: true,
        cart: {
          items: [],
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải giỏ hàng' };
    }
  }

  async addToCart(tenantId: string, userId: string, item: CartItem) {
    try {
      // In production, this would update KV store
      return { success: true, message: 'Đã thêm vào giỏ hàng' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi thêm vào giỏ hàng' };
    }
  }

  async checkout(tenantId: string, userId: string, data: CheckoutData) {
    try {
      const orderId = `order_${Date.now()}`;
      const now = new Date().toISOString();

      // Calculate totals
      const subtotal = data.cart_items.reduce((sum, item) => sum + item.total_price, 0);
      const discountAmount = data.discount_amount || 0;
      const taxPercent = data.tax_percent || 10;
      const taxAmount = Math.round((subtotal - discountAmount) * (taxPercent / 100));
      const total = subtotal - discountAmount + taxAmount;

      // Create order
      await this.env.DB.prepare(`
        INSERT INTO pos_orders (
          id, order_number, tenant_id, customer_id, customer_name, customer_phone,
          subtotal, discount, tax, total, payment_method, payment_status, status,
          notes, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        `POS-${Date.now()}`,
        tenantId,
        data.customer_info?.customer_id || null,
        data.customer_info?.name || null,
        data.customer_info?.phone || null,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        data.payment_method,
        'completed',
        'completed',
        data.notes || null,
        userId,
        now,
        now
      ).run();

      // Create order items
      for (const item of data.cart_items) {
        const itemId = `item_${Date.now()}_${Math.random()}`;
        await this.env.DB.prepare(`
          INSERT INTO pos_order_items (
            id, order_id, product_id, product_name, sku,
            quantity, unit_price, total_price, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId,
          orderId,
          item.product_id,
          item.product_name,
          item.sku,
          item.quantity,
          item.unit_price,
          item.total_price,
          now
        ).run();

        // AUTO-UPDATE SERIAL NUMBERS: Mark serials as sold (FIFO)
        const quantity = item.quantity || 1;
        const availableSerials = await this.env.DB.prepare(`
          SELECT id, serial_number FROM serial_numbers
          WHERE product_id = ?
            AND status = 'in_stock'
            AND COALESCE(tenant_id, 'default') = ?
          ORDER BY created_at ASC
          LIMIT ?
        `).bind(item.product_id, tenantId, quantity).all();

        if ((availableSerials.results || []).length < quantity) {
          console.warn(`Không đủ serial cho sản phẩm ${item.product_name}. Cần ${quantity}, chỉ có ${(availableSerials.results || []).length}`);
        }

        // Mark found serials as sold
        for (const serial of (availableSerials.results || [])) {
          await this.env.DB.prepare(`
            UPDATE serial_numbers
            SET status = 'sold',
                sold_date = ?,
                sold_to_customer_id = ?,
                order_id = ?,
                order_item_id = ?,
                updated_at = ?
            WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
          `).bind(
            now,
            data.customer_info?.customer_id || null,
            orderId,
            itemId,
            now,
            (serial as any).id,
            tenantId
          ).run();
        }

        // Update product stock (stock = count of in_stock serials)
        const stockCount = await this.env.DB.prepare(`
          SELECT COUNT(*) as count FROM serial_numbers
          WHERE product_id = ?
            AND status = 'in_stock'
            AND COALESCE(tenant_id, 'default') = ?
        `).bind(item.product_id, tenantId).first();

        await this.env.DB.prepare(`
          UPDATE products
          SET stock = ?, updated_at = ?
          WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind(
          Number((stockCount as any)?.count || 0),
          now,
          item.product_id,
          tenantId
        ).run();
      }

      // Update customer stats if customer exists
      if (data.customer_info?.customer_id) {
        await this.env.DB.prepare(`
          UPDATE customers
          SET total_spent = total_spent + ?,
              visit_count = visit_count + 1,
              loyalty_points = loyalty_points + ?,
              last_visit = ?,
              updated_at = ?
          WHERE id = ? AND tenant_id = ?
        `).bind(
          total,
          Math.floor(total / 1000), // 1 point per 1000 VND
          now,
          now,
          data.customer_info.customer_id,
          tenantId
        ).run();
      }

      return {
        success: true,
        order_id: orderId,
        order_number: `POS-${Date.now()}`,
        total
      };
    } catch (error: any) {
      console.error('Checkout error:', error);
      return { success: false, error: error.message || 'Lỗi khi thanh toán' };
    }
  }

  async getOrders(tenantId: string, page: number = 1, limit: number = 50) {
    try {
      const offset = (page - 1) * limit;

      const orders = await this.env.DB.prepare(`
        SELECT * FROM pos_orders
        WHERE tenant_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(tenantId, limit, offset).all();

      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM pos_orders WHERE tenant_id = ?
      `).bind(tenantId).first();

      return {
        success: true,
        orders: orders.results || [],
        pagination: {
          page,
          limit,
          total: Number((countResult as any)?.total) || 0,
          pages: Math.ceil((Number((countResult as any)?.total) || 0) / limit)
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải đơn hàng' };
    }
  }

  async getOrderById(orderId: string, tenantId: string) {
    try {
      const order = await this.env.DB.prepare(`
        SELECT * FROM pos_orders WHERE id = ? AND tenant_id = ?
      `).bind(orderId, tenantId).first();

      if (!order) {
        return { success: false, error: 'Không tìm thấy đơn hàng' };
      }

      const items = await this.env.DB.prepare(`
        SELECT * FROM pos_order_items WHERE order_id = ?
      `).bind(orderId).all();

      return {
        success: true,
        order: {
          ...order,
          items: items.results || []
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải đơn hàng' };
    }
  }

  async createOrder(orderData: any, items: any[]): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const orderId = crypto.randomUUID();
      const now = new Date().toISOString();
      const orderNumber = `POS-${Date.now()}`;

      await this.env.DB.prepare(`
        INSERT INTO pos_orders (
          id, order_number, tenant_id, customer_id, customer_name, customer_phone,
          subtotal, discount, tax, total, payment_method, payment_status, status,
          notes, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        orderNumber,
        orderData.tenant_id,
        orderData.customer_id || null,
        orderData.customer_name || null,
        orderData.customer_phone || null,
        orderData.subtotal || 0,
        orderData.discount || 0,
        orderData.tax || 0,
        orderData.total || 0,
        orderData.payment_method || 'cash',
        'completed',
        orderData.status || 'active',
        orderData.notes || null,
        orderData.created_by || null,
        now,
        now
      ).run();

      for (const item of items) {
        const itemId = crypto.randomUUID();
        await this.env.DB.prepare(`
          INSERT INTO pos_order_items (
            id, order_id, product_id, product_name, sku,
            quantity, unit_price, total_price, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId,
          orderId,
          item.product_id,
          item.product_name || '',
          item.sku || '',
          item.quantity || 1,
          item.unit_price || 0,
          item.total_price || 0,
          now
        ).run();

        // AUTO-UPDATE SERIAL NUMBERS: Mark serials as sold
        if (item.serial_numbers && Array.isArray(item.serial_numbers)) {
          // If specific serials provided in order
          for (const serialNumber of item.serial_numbers) {
            await this.env.DB.prepare(`
              UPDATE serial_numbers
              SET status = 'sold',
                  sold_date = ?,
                  sold_to_customer_id = ?,
                  order_id = ?,
                  order_item_id = ?,
                  updated_at = ?
              WHERE serial_number = ? AND COALESCE(tenant_id, 'default') = ?
            `).bind(
              now,
              orderData.customer_id || null,
              orderId,
              itemId,
              now,
              serialNumber,
              orderData.tenant_id
            ).run();
          }
        } else {
          // Auto-assign available serials (FIFO - First In First Out)
          const quantity = item.quantity || 1;
          const availableSerials = await this.env.DB.prepare(`
            SELECT id, serial_number FROM serial_numbers
            WHERE product_id = ?
              AND status = 'in_stock'
              AND COALESCE(tenant_id, 'default') = ?
            ORDER BY created_at ASC
            LIMIT ?
          `).bind(item.product_id, orderData.tenant_id, quantity).all();

          if ((availableSerials.results || []).length < quantity) {
            console.warn(`Không đủ serial cho sản phẩm ${item.product_name}. Cần ${quantity}, chỉ có ${(availableSerials.results || []).length}`);
          }

          // Mark found serials as sold
          for (const serial of (availableSerials.results || [])) {
            await this.env.DB.prepare(`
              UPDATE serial_numbers
              SET status = 'sold',
                  sold_date = ?,
                  sold_to_customer_id = ?,
                  order_id = ?,
                  order_item_id = ?,
                  updated_at = ?
              WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
            `).bind(
              now,
              orderData.customer_id || null,
              orderId,
              itemId,
              now,
              (serial as any).id,
              orderData.tenant_id
            ).run();
          }
        }

        // Update product stock (stock = count of in_stock serials)
        const stockCount = await this.env.DB.prepare(`
          SELECT COUNT(*) as count FROM serial_numbers
          WHERE product_id = ?
            AND status = 'in_stock'
            AND COALESCE(tenant_id, 'default') = ?
        `).bind(item.product_id, orderData.tenant_id).first();

        await this.env.DB.prepare(`
          UPDATE products
          SET stock = ?, updated_at = ?
          WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind(
          Number((stockCount as any)?.count || 0),
          now,
          item.product_id,
          orderData.tenant_id
        ).run();
      }

      return {
        success: true,
        order: {
          id: orderId,
          order_number: orderNumber,
          total: orderData.total
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async logAudit(tenantId: string, userId: string, action: string, entityType: string, entityId: string, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, tenantId, userId, action, entityType, entityId, now).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
