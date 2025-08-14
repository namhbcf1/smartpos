import { Env } from '../../types';
import { 
  Sale, 
  SaleCreateData, 
  SaleUpdateData, 
  SaleQueryParams, 
  SaleStats,
  SaleItem,
  SalePayment,
  QuickSaleData
} from './types';
import { SalesDatabase } from './database';
import { CacheManager, CacheKeys } from '../../utils/cache';

export class SalesService {
  private db: SalesDatabase;
  private cache: CacheManager;

  constructor(private env: Env) {
    this.db = new SalesDatabase(env);
    this.cache = new CacheManager(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    await this.db.initializeTables();
    // Skip default data creation for now
    // await this.db.createDefaultData();
  }

  // Get sales summary for a specific date
  async getSalesSummary(date: string): Promise<any> {
    try {
      // Today's data
      const today = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as sales_count,
          COALESCE(SUM(total_amount), 0) as total_amount,
          COALESCE(AVG(total_amount), 0) as average_sale
        FROM sales
        WHERE DATE(created_at) = DATE('now')
      `).first();

      // Yesterday's data
      const yesterday = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as sales_count,
          COALESCE(SUM(total_amount), 0) as total_amount,
          COALESCE(AVG(total_amount), 0) as average_sale
        FROM sales
        WHERE DATE(created_at) = DATE('now', '-1 day')
      `).first();

      // This week's data
      const thisWeek = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as sales_count,
          COALESCE(SUM(total_amount), 0) as total_amount,
          COALESCE(AVG(total_amount), 0) as average_sale
        FROM sales
        WHERE DATE(created_at) >= DATE('now', '-7 days')
      `).first();

      // This month's data
      const thisMonth = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as sales_count,
          COALESCE(SUM(total_amount), 0) as total_amount,
          COALESCE(AVG(total_amount), 0) as average_sale
        FROM sales
        WHERE DATE(created_at) >= DATE('now', 'start of month')
      `).first();

      // Calculate growth rates
      const dailyGrowth = yesterday?.sales_count > 0
        ? ((today?.sales_count || 0) - (yesterday?.sales_count || 0)) / (yesterday?.sales_count || 1) * 100
        : 0;

      return {
        today: {
          sales_count: today?.sales_count || 0,
          total_amount: today?.total_amount || 0,
          average_sale: today?.average_sale || 0
        },
        yesterday: {
          sales_count: yesterday?.sales_count || 0,
          total_amount: yesterday?.total_amount || 0,
          average_sale: yesterday?.average_sale || 0
        },
        this_week: {
          sales_count: thisWeek?.sales_count || 0,
          total_amount: thisWeek?.total_amount || 0,
          average_sale: thisWeek?.average_sale || 0
        },
        this_month: {
          sales_count: thisMonth?.sales_count || 0,
          total_amount: thisMonth?.total_amount || 0,
          average_sale: thisMonth?.average_sale || 0
        },
        growth_rates: {
          daily: dailyGrowth,
          weekly: 0, // TODO: Calculate weekly growth
          monthly: 0 // TODO: Calculate monthly growth
        }
      };
    } catch (error) {
      console.error('Error getting sales summary:', error);
      return {
        today: { sales_count: 0, total_amount: 0, average_sale: 0 },
        yesterday: { sales_count: 0, total_amount: 0, average_sale: 0 },
        this_week: { sales_count: 0, total_amount: 0, average_sale: 0 },
        this_month: { sales_count: 0, total_amount: 0, average_sale: 0 },
        growth_rates: { daily: 0, weekly: 0, monthly: 0 }
      };
    }
  }

  // Get all sales with filtering and pagination
  async getSales(params: SaleQueryParams): Promise<{ sales: Sale[]; total: number; stats?: SaleStats }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        customer_id,
        user_id,
        store_id,
        payment_method,
        payment_status,
        sale_status,
        date_from,
        date_to,
        min_amount,
        max_amount,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params;

      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const bindings: any[] = [];

      if (search) {
        conditions.push('(s.sale_number LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ?)');
        const searchTerm = `%${search}%`;
        bindings.push(searchTerm, searchTerm, searchTerm);
      }

      if (customer_id) {
        conditions.push('s.customer_id = ?');
        bindings.push(customer_id);
      }

      if (user_id) {
        conditions.push('s.user_id = ?');
        bindings.push(user_id);
      }

      if (store_id) {
        conditions.push('s.store_id = ?');
        bindings.push(store_id);
      }

      if (payment_method) {
        conditions.push('s.payment_method = ?');
        bindings.push(payment_method);
      }

      if (payment_status) {
        conditions.push('s.payment_status = ?');
        bindings.push(payment_status);
      }

      if (sale_status) {
        conditions.push('s.sale_status = ?');
        bindings.push(sale_status);
      }

      if (date_from) {
        conditions.push('DATE(s.created_at) >= ?');
        bindings.push(date_from);
      }

      if (date_to) {
        conditions.push('DATE(s.created_at) <= ?');
        bindings.push(date_to);
      }

      if (min_amount) {
        conditions.push('s.final_amount >= ?');
        bindings.push(min_amount);
      }

      if (max_amount) {
        conditions.push('s.final_amount <= ?');
        bindings.push(max_amount);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      const validSortFields = ['created_at', 'total_amount', 'customer_name', 'sale_number', 'final_amount'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

      // Get sales with joined data
      const query = `
        SELECT 
          s.*,
          u.full_name as user_name,
          st.name as store_name,
          c.full_name as customer_full_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN customers c ON s.customer_id = c.id
        ${whereClause}
        ORDER BY s.${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      const sales = await this.env.DB.prepare(query)
        .bind(...bindings, limit, offset)
        .all<Sale>();

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sales s
        ${whereClause}
      `;

      const countResult = await this.env.DB.prepare(countQuery)
        .bind(...bindings)
        .first<{ total: number }>();

      const total = countResult?.total || 0;

      // Get stats if requested (first page only)
      let stats: SaleStats | undefined;
      if (page === 1) {
        stats = await this.db.getStats();
      }

      return {
        sales: sales.results || [],
        total,
        stats
      };
    } catch (error) {
      console.error('Error getting sales:', error);
      throw new Error('Failed to get sales');
    }
  }

  // Get sale by ID with items and payments
  async getSaleById(id: number): Promise<Sale | null> {
    try {
      const cacheKey = CacheKeys.sale(id);
      const cached = await this.cache.get<Sale>(cacheKey);
      if (cached) return cached;

      // Get sale with joined data
      const sale = await this.env.DB.prepare(`
        SELECT 
          s.*,
          u.full_name as user_name,
          st.name as store_name,
          c.full_name as customer_full_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `).bind(id).first<Sale>();

      if (!sale) return null;

      // Get sale items
      const items = await this.env.DB.prepare(`
        SELECT 
          si.*,
          p.image_url as product_image_url,
          p.category_name as product_category,
          p.stock_quantity as current_stock
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
        ORDER BY si.id
      `).bind(id).all<SaleItem>();

      // Get sale payments
      const payments = await this.env.DB.prepare(`
        SELECT sp.*
        FROM sale_payments sp
        WHERE sp.sale_id = ?
        ORDER BY sp.created_at
      `).bind(id).all<SalePayment>();

      sale.items = items.results || [];
      sale.payments = payments.results || [];

      await this.cache.set(cacheKey, sale, 300); // Cache for 5 minutes
      return sale;
    } catch (error) {
      console.error('Error getting sale by ID:', error);
      throw new Error('Failed to get sale');
    }
  }

  // Create new sale
  async createSale(data: SaleCreateData, createdBy: number): Promise<Sale> {
    try {
      // Generate sale number
      const saleNumber = await this.db.generateSaleNumber();

      // Calculate totals
      let totalAmount = 0;
      let taxAmount = 0;
      const discountAmount = data.discount_amount || 0;

      // Validate and calculate item totals
      for (const item of data.items) {
        // Get product info
        const product = await this.env.DB.prepare(
          'SELECT id, name, sku, price, stock_quantity FROM products WHERE id = ? AND is_active = 1'
        ).bind(item.product_id).first<any>();

        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found or inactive`);
        }

        // Check stock
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Required: ${item.quantity}`);
        }

        const unitPrice = item.unit_price || product.price;
        const itemTotal = (unitPrice * item.quantity) - (item.discount_amount || 0);
        totalAmount += itemTotal;
      }

      // Calculate tax
      const taxRate = data.tax_rate || 0.1; // 10% default
      taxAmount = totalAmount * taxRate;
      const finalAmount = totalAmount + taxAmount - discountAmount;

      // Validate payments
      const totalPayments = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (totalPayments < finalAmount) {
        throw new Error('Payment amount is less than sale total');
      }

      // Create sale
      const saleResult = await this.env.DB.prepare(`
        INSERT INTO sales (
          customer_id, customer_name, customer_phone, customer_email,
          user_id, sale_number, total_amount, tax_amount, discount_amount,
          final_amount, payment_method, payment_status, sale_status,
          notes, receipt_printed, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.customer_id,
        data.customer_name,
        data.customer_phone,
        data.customer_email,
        createdBy,
        saleNumber,
        totalAmount,
        taxAmount,
        discountAmount,
        finalAmount,
        data.payments[0]?.payment_method || 'cash',
        totalPayments >= finalAmount ? 'paid' : 'partial',
        'completed',
        data.notes,
        data.receipt_printed ? 1 : 0,
        createdBy
      ).run();

      const saleId = saleResult.meta.last_row_id as number;

      // Create sale items and update stock
      for (const item of data.items) {
        const product = await this.env.DB.prepare(
          'SELECT name, sku, price FROM products WHERE id = ?'
        ).bind(item.product_id).first<any>();

        const unitPrice = item.unit_price || product.price;
        const itemTotal = (unitPrice * item.quantity) - (item.discount_amount || 0);

        // Create sale item
        await this.env.DB.prepare(`
          INSERT INTO sale_items (
            sale_id, product_id, product_name, product_sku,
            quantity, unit_price, discount_amount, total_amount, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          saleId,
          item.product_id,
          product.name,
          product.sku,
          item.quantity,
          unitPrice,
          item.discount_amount || 0,
          itemTotal,
          item.notes
        ).run();

        // Update product stock
        await this.env.DB.prepare(`
          UPDATE products 
          SET stock_quantity = stock_quantity - ?, 
              total_sold = total_sold + ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(item.quantity, item.quantity, item.product_id).run();
      }

      // Create sale payments
      for (const payment of data.payments) {
        await this.env.DB.prepare(`
          INSERT INTO sale_payments (
            sale_id, payment_method, amount, reference_number,
            transaction_id, status, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          saleId,
          payment.payment_method,
          payment.amount,
          payment.reference_number,
          payment.transaction_id,
          'completed',
          payment.notes,
          createdBy
        ).run();
      }

      // Clear cache
      await this.cache.delete(CacheKeys.salesList());

      const newSale = await this.getSaleById(saleId);
      if (!newSale) {
        throw new Error('Failed to retrieve created sale');
      }

      return newSale;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  // Quick sale for POS
  async createQuickSale(data: QuickSaleData, userId: number): Promise<Sale> {
    try {
      // Convert to full sale data
      const saleData: SaleCreateData = {
        customer_phone: data.customer_phone,
        items: data.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          discount_amount: 0
        })),
        payments: [{
          payment_method: data.payment_method,
          amount: data.amount_paid
        }],
        discount_amount: data.discount_amount || 0,
        receipt_printed: true
      };

      return await this.createSale(saleData, userId);
    } catch (error) {
      console.error('Error creating quick sale:', error);
      throw error;
    }
  }

  // Update sale
  async updateSale(id: number, data: SaleUpdateData, updatedBy: number): Promise<Sale> {
    try {
      const existingSale = await this.getSaleById(id);
      if (!existingSale) {
        throw new Error('Sale not found');
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const bindings: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'updated_by') {
          if (typeof value === 'boolean') {
            updateFields.push(`${key} = ?`);
            bindings.push(value ? 1 : 0);
          } else {
            updateFields.push(`${key} = ?`);
            bindings.push(value);
          }
        }
      });

      updateFields.push('updated_by = ?', 'updated_at = datetime(\'now\')');
      bindings.push(updatedBy, id);

      await this.env.DB.prepare(`
        UPDATE sales 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...bindings).run();

      // Clear cache
      await this.cache.delete(CacheKeys.sale(id));
      await this.cache.delete(CacheKeys.salesList());

      const updatedSale = await this.getSaleById(id);
      if (!updatedSale) {
        throw new Error('Failed to retrieve updated sale');
      }

      return updatedSale;
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  }

  // Get sales statistics
  async getStats(): Promise<SaleStats> {
    return await this.db.getStats();
  }

  // Get today's sales summary
  async getTodaysSummary(): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const summary = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(final_amount), 0) as total_revenue,
          COALESCE(AVG(final_amount), 0) as average_sale,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as completed_sales,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_sales
        FROM sales 
        WHERE DATE(created_at) = ?
      `).bind(today).first<any>();

      return summary || {
        total_sales: 0,
        total_revenue: 0,
        average_sale: 0,
        completed_sales: 0,
        pending_sales: 0
      };
    } catch (error) {
      console.error('Error getting today\'s summary:', error);
      throw new Error('Failed to get today\'s summary');
    }
  }
}
