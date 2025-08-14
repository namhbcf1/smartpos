import { Env } from '../../types';
import { Return, ReturnStats, ReturnItem, RefundTransaction } from './types';

export class ReturnsDatabase {
  constructor(private env: Env) {}

  // Initialize all returns-related tables
  async initializeTables(): Promise<void> {
    try {
      // Returns table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS returns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_sale_id INTEGER NOT NULL,
          return_number TEXT NOT NULL UNIQUE,
          return_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          return_reason TEXT NOT NULL,
          return_status TEXT NOT NULL DEFAULT 'pending',
          refund_method TEXT NOT NULL DEFAULT 'cash',
          refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          store_credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
          restocking_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
          reference_number TEXT,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          approved_at DATETIME,
          approved_by INTEGER,
          completed_at DATETIME,
          completed_by INTEGER,
          FOREIGN KEY (original_sale_id) REFERENCES sales (id),
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (approved_by) REFERENCES users (id),
          FOREIGN KEY (completed_by) REFERENCES users (id)
        )
      `).run();

      // Return items table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS return_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          sale_item_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          product_sku TEXT NOT NULL,
          quantity_returned INTEGER NOT NULL,
          quantity_original INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          return_reason TEXT,
          condition TEXT NOT NULL DEFAULT 'used',
          restockable INTEGER NOT NULL DEFAULT 1,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE CASCADE,
          FOREIGN KEY (sale_item_id) REFERENCES sale_items (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `).run();

      // Refund transactions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS refund_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          transaction_type TEXT NOT NULL DEFAULT 'refund',
          amount DECIMAL(10,2) NOT NULL,
          payment_method TEXT NOT NULL,
          reference_number TEXT,
          transaction_id TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `).run();

      // Return policies table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS return_policies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          return_period_days INTEGER NOT NULL DEFAULT 30,
          restocking_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
          processing_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          conditions TEXT,
          applicable_categories TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Return reasons table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS return_reasons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL DEFAULT 'other',
          requires_approval INTEGER NOT NULL DEFAULT 0,
          auto_restock INTEGER NOT NULL DEFAULT 1,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Exchange requests table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS exchange_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          return_id INTEGER NOT NULL,
          original_product_id INTEGER NOT NULL,
          new_product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price_difference DECIMAL(10,2) NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE CASCADE,
          FOREIGN KEY (original_product_id) REFERENCES products (id),
          FOREIGN KEY (new_product_id) REFERENCES products (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `).run();

      // Store credits table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS store_credits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          return_id INTEGER,
          credit_number TEXT NOT NULL UNIQUE,
          amount DECIMAL(10,2) NOT NULL,
          balance DECIMAL(10,2) NOT NULL,
          expiry_date DATE,
          status TEXT NOT NULL DEFAULT 'active',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          FOREIGN KEY (customer_id) REFERENCES customers (id),
          FOREIGN KEY (return_id) REFERENCES returns (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `).run();

      // Store credit transactions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS store_credit_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          store_credit_id INTEGER NOT NULL,
          transaction_type TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          balance_before DECIMAL(10,2) NOT NULL,
          balance_after DECIMAL(10,2) NOT NULL,
          reference_type TEXT,
          reference_id INTEGER,
          description TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          FOREIGN KEY (store_credit_id) REFERENCES store_credits (id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `).run();

      // Create indexes for better performance
      await this.createIndexes();

      console.log('Returns tables initialized successfully');
    } catch (error) {
      console.error('Error initializing returns tables:', error);
      throw error;
    }
  }

  // Create database indexes
  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_returns_original_sale_id ON returns (original_sale_id)',
      'CREATE INDEX IF NOT EXISTS idx_returns_return_number ON returns (return_number)',
      'CREATE INDEX IF NOT EXISTS idx_returns_return_status ON returns (return_status)',
      'CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns (created_at)',
      'CREATE INDEX IF NOT EXISTS idx_returns_created_by ON returns (created_by)',
      'CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items (return_id)',
      'CREATE INDEX IF NOT EXISTS idx_return_items_product_id ON return_items (product_id)',
      'CREATE INDEX IF NOT EXISTS idx_refund_transactions_return_id ON refund_transactions (return_id)',
      'CREATE INDEX IF NOT EXISTS idx_store_credits_customer_id ON store_credits (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_store_credits_status ON store_credits (status)',
      'CREATE INDEX IF NOT EXISTS idx_store_credit_transactions_store_credit_id ON store_credit_transactions (store_credit_id)'
    ];

    for (const indexQuery of indexes) {
      await this.env.DB.prepare(indexQuery).run();
    }
  }

  // Create default data
  async createDefaultData(): Promise<void> {
    try {
      // Check if we have any return policies
      const policiesCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM return_policies'
      ).first<{ count: number }>();

      if (policiesCount && policiesCount.count === 0) {
        console.log('Creating default return policies...');
        
        // Create default return policy
        await this.env.DB.prepare(`
          INSERT INTO return_policies (
            name, description, return_period_days, restocking_fee_percentage,
            processing_fee_amount, is_active
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          'Chính sách trả hàng tiêu chuẩn',
          'Chính sách trả hàng trong vòng 30 ngày với điều kiện sản phẩm còn nguyên vẹn',
          30,
          5.0, // 5% restocking fee
          0, // No processing fee
          1
        ).run();

        console.log('Default return policies created');
      }

      // Check if we have any return reasons
      const reasonsCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM return_reasons'
      ).first<{ count: number }>();

      if (reasonsCount && reasonsCount.count === 0) {
        console.log('Creating default return reasons...');
        
        const reasons = [
          { code: 'DEFECTIVE', name: 'Sản phẩm lỗi', category: 'defective', requires_approval: 0, auto_restock: 0 },
          { code: 'WRONG_ITEM', name: 'Giao sai sản phẩm', category: 'wrong_item', requires_approval: 0, auto_restock: 1 },
          { code: 'NOT_AS_DESC', name: 'Không đúng mô tả', category: 'not_as_described', requires_approval: 1, auto_restock: 0 },
          { code: 'CHANGE_MIND', name: 'Khách hàng đổi ý', category: 'customer_change', requires_approval: 1, auto_restock: 1 },
          { code: 'DAMAGED', name: 'Sản phẩm bị hỏng', category: 'damaged', requires_approval: 0, auto_restock: 0 },
          { code: 'OTHER', name: 'Lý do khác', category: 'other', requires_approval: 1, auto_restock: 0 }
        ];

        for (const reason of reasons) {
          await this.env.DB.prepare(`
            INSERT INTO return_reasons (
              code, name, category, requires_approval, auto_restock, is_active
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            reason.code, reason.name, reason.category, 
            reason.requires_approval, reason.auto_restock, 1
          ).run();
        }

        console.log('Default return reasons created');
      }
    } catch (error) {
      console.error('Error creating default returns data:', error);
      // Don't throw error for default data creation
    }
  }

  // Get returns statistics
  async getStats(): Promise<ReturnStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);

      // Basic stats
      const basicStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_returns,
          COALESCE(SUM(return_amount), 0) as total_return_amount,
          COALESCE(AVG(return_amount), 0) as average_return_amount,
          COUNT(CASE WHEN return_status = 'pending' THEN 1 END) as pending_returns,
          COUNT(CASE WHEN return_status = 'approved' THEN 1 END) as approved_returns,
          COUNT(CASE WHEN return_status = 'completed' THEN 1 END) as completed_returns,
          COUNT(CASE WHEN return_status = 'rejected' THEN 1 END) as rejected_returns
        FROM returns
      `).first<any>();

      // Today's stats
      const todayStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as returns_today,
          COALESCE(SUM(return_amount), 0) as return_amount_today
        FROM returns 
        WHERE DATE(created_at) = ?
      `).bind(today).first<any>();

      // Week stats
      const weekStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as returns_this_week,
          COALESCE(SUM(return_amount), 0) as return_amount_this_week
        FROM returns 
        WHERE created_at >= ?
      `).bind(weekStart.toISOString()).first<any>();

      // Month stats
      const monthStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as returns_this_month,
          COALESCE(SUM(return_amount), 0) as return_amount_this_month
        FROM returns 
        WHERE created_at >= ?
      `).bind(monthStart.toISOString()).first<any>();

      // Calculate return rate (returns vs sales)
      const salesCount = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_sales FROM sales WHERE sale_status = 'completed'
      `).first<{ total_sales: number }>();

      const returnRate = salesCount && salesCount.total_sales > 0 
        ? ((basicStats?.total_returns || 0) / salesCount.total_sales) * 100 
        : 0;

      return {
        total_returns: basicStats?.total_returns || 0,
        total_return_amount: basicStats?.total_return_amount || 0,
        pending_returns: basicStats?.pending_returns || 0,
        approved_returns: basicStats?.approved_returns || 0,
        completed_returns: basicStats?.completed_returns || 0,
        rejected_returns: basicStats?.rejected_returns || 0,
        returns_today: todayStats?.returns_today || 0,
        return_amount_today: todayStats?.return_amount_today || 0,
        returns_this_week: weekStats?.returns_this_week || 0,
        return_amount_this_week: weekStats?.return_amount_this_week || 0,
        returns_this_month: monthStats?.returns_this_month || 0,
        return_amount_this_month: monthStats?.return_amount_this_month || 0,
        average_return_amount: basicStats?.average_return_amount || 0,
        return_rate_percentage: returnRate,
        top_return_reasons: [],
        return_trends: [],
        product_return_analysis: [],
        refund_method_breakdown: []
      };
    } catch (error) {
      console.error('Error getting returns stats:', error);
      throw new Error('Failed to get returns statistics');
    }
  }

  // Generate unique return number
  async generateReturnNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get today's return count
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM returns 
      WHERE DATE(created_at) = DATE('now')
    `).first<{ count: number }>();

    const sequence = String((count?.count || 0) + 1).padStart(4, '0');
    return `RET-${dateStr}-${sequence}`;
  }

  // Generate unique store credit number
  async generateStoreCreditNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get today's store credit count
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM store_credits 
      WHERE DATE(created_at) = DATE('now')
    `).first<{ count: number }>();

    const sequence = String((count?.count || 0) + 1).padStart(4, '0');
    return `SC-${dateStr}-${sequence}`;
  }
}
