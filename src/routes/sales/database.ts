import { Env } from '../../types';
import { Sale, SaleItem, SalePayment, SaleStats, SaleReturn, POSSession } from './types';

export class SalesDatabase {
  constructor(private env: Env) {}

  // Initialize all sales-related tables
  async initializeTables(): Promise<void> {
    try {
      console.log('Initializing sales tables...');
      // Sales table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          customer_name TEXT,
          customer_phone TEXT,
          customer_email TEXT,
          store_id INTEGER,
          user_id INTEGER NOT NULL,
          sale_number TEXT NOT NULL UNIQUE,
          total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          payment_method TEXT NOT NULL DEFAULT 'cash',
          payment_status TEXT NOT NULL DEFAULT 'pending',
          sale_status TEXT NOT NULL DEFAULT 'draft',
          notes TEXT,
          receipt_printed INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          updated_by INTEGER
        )
      `).run();

      // Sale items table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          product_sku TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_amount DECIMAL(10,2) NOT NULL,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Sale payments table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sale_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          payment_method TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          reference_number TEXT,
          transaction_id TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL
        )
      `).run();

      // Sale returns table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sale_returns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          return_number TEXT NOT NULL UNIQUE,
          total_amount DECIMAL(10,2) NOT NULL,
          reason TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          approved_at DATETIME,
          approved_by INTEGER
        )
      `).run();

      // Sale return items table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sale_return_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          sale_item_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          reason TEXT,
          condition TEXT NOT NULL DEFAULT 'new',
          created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // POS sessions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS pos_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          store_id INTEGER,
          session_number TEXT NOT NULL UNIQUE,
          opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
          closing_cash DECIMAL(10,2),
          total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_cash_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_card_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_other_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'open',
          opened_at DATETIME NOT NULL DEFAULT (datetime('now')),
          closed_at DATETIME,
          notes TEXT
        )
      `).run();

      // Receipts table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS receipts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          receipt_number TEXT NOT NULL UNIQUE,
          template TEXT NOT NULL DEFAULT 'standard',
          content TEXT NOT NULL,
          printed_at DATETIME,
          printed_by INTEGER,
          email_sent INTEGER NOT NULL DEFAULT 0,
          email_sent_at DATETIME,
          created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Skip indexes for now
      // await this.createIndexes();

      console.log('Sales tables initialized successfully');
    } catch (error) {
      console.error('Error initializing sales tables:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to initialize sales tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Create database indexes
  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales (store_id)',
      'CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at)',
      'CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON sales (sale_number)',
      'CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales (payment_status)',
      'CREATE INDEX IF NOT EXISTS idx_sales_sale_status ON sales (sale_status)',
      'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items (sale_id)',
      'CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items (product_id)',
      'CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON sale_payments (sale_id)',
      'CREATE INDEX IF NOT EXISTS idx_sale_returns_sale_id ON sale_returns (sale_id)',
      'CREATE INDEX IF NOT EXISTS idx_pos_sessions_user_id ON pos_sessions (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions (status)',
      'CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts (sale_id)'
    ];

    for (const indexQuery of indexes) {
      await this.env.DB.prepare(indexQuery).run();
    }
  }

  // Create default data
  async createDefaultData(): Promise<void> {
    try {
      // Check if we have any sales data
      const salesCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM sales'
      ).first<{ count: number }>();

      if (salesCount && salesCount.count === 0) {
        console.log('Sales tables ready for real data entry...');

        // Sales structure ready for production use
        console.log('Sales structure initialized');
      }
    } catch (error) {
      console.error('Error creating default sales data:', error);
      // Don't throw error for default data creation
    }
  }

  // Get sales statistics
  async getStats(): Promise<SaleStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);

      // Basic stats
      const basicStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(final_amount), 0) as total_revenue,
          COALESCE(SUM(tax_amount), 0) as total_tax,
          COALESCE(SUM(discount_amount), 0) as total_discount,
          COALESCE(AVG(final_amount), 0) as average_sale_amount,
          COUNT(CASE WHEN sale_status = 'completed' THEN 1 END) as completed_sales,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_sales,
          COUNT(CASE WHEN sale_status = 'cancelled' THEN 1 END) as cancelled_sales,
          COUNT(CASE WHEN sale_status = 'returned' THEN 1 END) as returned_sales
        FROM sales
      `).first<any>();

      // Today's stats
      const todayStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as sales_today,
          COALESCE(SUM(final_amount), 0) as revenue_today
        FROM sales 
        WHERE DATE(created_at) = ?
      `).bind(today).first<any>();

      // Week stats
      const weekStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as sales_this_week,
          COALESCE(SUM(final_amount), 0) as revenue_this_week
        FROM sales 
        WHERE created_at >= ?
      `).bind(weekStart.toISOString()).first<any>();

      // Month stats
      const monthStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as sales_this_month,
          COALESCE(SUM(final_amount), 0) as revenue_this_month
        FROM sales 
        WHERE created_at >= ?
      `).bind(monthStart.toISOString()).first<any>();

      // Top payment method
      const topPaymentMethod = await this.env.DB.prepare(`
        SELECT payment_method, COUNT(*) as count
        FROM sales
        GROUP BY payment_method
        ORDER BY count DESC
        LIMIT 1
      `).first<{ payment_method: string }>();

      return {
        total_sales: basicStats?.total_sales || 0,
        total_revenue: basicStats?.total_revenue || 0,
        total_tax: basicStats?.total_tax || 0,
        total_discount: basicStats?.total_discount || 0,
        average_sale_amount: basicStats?.average_sale_amount || 0,
        sales_today: todayStats?.sales_today || 0,
        revenue_today: todayStats?.revenue_today || 0,
        sales_this_week: weekStats?.sales_this_week || 0,
        revenue_this_week: weekStats?.revenue_this_week || 0,
        sales_this_month: monthStats?.sales_this_month || 0,
        revenue_this_month: monthStats?.revenue_this_month || 0,
        top_payment_method: topPaymentMethod?.payment_method || 'cash',
        completed_sales: basicStats?.completed_sales || 0,
        pending_sales: basicStats?.pending_sales || 0,
        cancelled_sales: basicStats?.cancelled_sales || 0,
        returned_sales: basicStats?.returned_sales || 0,
        growth_rate: 0, // Calculate based on previous period
        best_selling_products: [],
        sales_by_hour: [],
        sales_by_day: [],
        payment_methods_breakdown: []
      };
    } catch (error) {
      console.error('Error getting sales stats:', error);
      throw new Error('Failed to get sales statistics');
    }
  }

  // Generate unique sale number
  async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get today's sale count
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM sales 
      WHERE DATE(created_at) = DATE('now')
    `).first<{ count: number }>();

    const sequence = String((count?.count || 0) + 1).padStart(4, '0');
    return `SALE-${dateStr}-${sequence}`;
  }

  // Generate unique return number
  async generateReturnNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get today's return count
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM sale_returns 
      WHERE DATE(created_at) = DATE('now')
    `).first<{ count: number }>();

    const sequence = String((count?.count || 0) + 1).padStart(4, '0');
    return `RET-${dateStr}-${sequence}`;
  }
}
