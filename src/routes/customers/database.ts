import { Env } from '../../types';
import { Customer, CustomerStats, LoyaltyTransaction } from './types';

export class CustomersDatabase {
  constructor(private env: Env) {}

  // Initialize all customer-related tables
  async initializeTables(): Promise<void> {
    try {
      // Customers table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_code TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          date_of_birth DATE,
          gender TEXT,
          address TEXT,
          city TEXT,
          district TEXT,
          ward TEXT,
          postal_code TEXT,
          country TEXT DEFAULT 'Vietnam',
          customer_type TEXT NOT NULL DEFAULT 'individual',
          company_name TEXT,
          tax_number TEXT,
          is_vip INTEGER NOT NULL DEFAULT 0,
          vip_level TEXT,
          credit_limit DECIMAL(10,2),
          current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
          loyalty_points INTEGER NOT NULL DEFAULT 0,
          total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_orders INTEGER NOT NULL DEFAULT 0,
          average_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
          last_order_date DATETIME,
          registration_date DATE NOT NULL DEFAULT (date('now')),
          is_active INTEGER NOT NULL DEFAULT 1,
          notes TEXT,
          preferences TEXT,
          marketing_consent INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          updated_by INTEGER,
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (updated_by) REFERENCES users (id)
        )
      `).run();

      // Customer addresses table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customer_addresses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          type TEXT NOT NULL DEFAULT 'home',
          label TEXT,
          address_line_1 TEXT NOT NULL,
          address_line_2 TEXT,
          city TEXT NOT NULL,
          district TEXT,
          ward TEXT,
          postal_code TEXT,
          country TEXT NOT NULL DEFAULT 'Vietnam',
          is_default INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
        )
      `).run();

      // Customer contacts table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customer_contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          label TEXT,
          value TEXT NOT NULL,
          is_primary INTEGER NOT NULL DEFAULT 0,
          is_verified INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
        )
      `).run();

      // Customer notes table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customer_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          note TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'general',
          priority TEXT NOT NULL DEFAULT 'medium',
          is_private INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `).run();

      // Customer groups table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customer_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          discount_percentage DECIMAL(5,2),
          special_pricing INTEGER NOT NULL DEFAULT 0,
          min_order_value DECIMAL(10,2),
          max_credit_limit DECIMAL(10,2),
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Customer group memberships table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customer_group_memberships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          group_id INTEGER NOT NULL,
          joined_at DATETIME NOT NULL DEFAULT (datetime('now')),
          is_active INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES customer_groups (id) ON DELETE CASCADE,
          UNIQUE(customer_id, group_id)
        )
      `).run();

      // Loyalty transactions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS loyalty_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          transaction_type TEXT NOT NULL,
          points INTEGER NOT NULL,
          balance_before INTEGER NOT NULL,
          balance_after INTEGER NOT NULL,
          reference_type TEXT,
          reference_id INTEGER,
          description TEXT NOT NULL,
          expiry_date DATE,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `).run();

      // Loyalty programs table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS loyalty_programs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          points_per_currency DECIMAL(10,2) NOT NULL DEFAULT 1,
          currency_per_point DECIMAL(10,2) NOT NULL DEFAULT 1,
          min_points_to_redeem INTEGER NOT NULL DEFAULT 100,
          max_points_per_transaction INTEGER,
          expiry_months INTEGER,
          is_active INTEGER NOT NULL DEFAULT 1,
          start_date DATE,
          end_date DATE,
          terms_and_conditions TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Customer segments table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customer_segments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          criteria TEXT NOT NULL,
          customer_count INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Run migrations to add missing columns
      await this.runMigrations();

      // Create indexes for better performance
      await this.createIndexes();

      console.log('Customer tables initialized successfully');
    } catch (error) {
      console.error('Error initializing customer tables:', error);
      throw error;
    }
  }

  // Run database migrations to add missing columns
  private async runMigrations(): Promise<void> {
    try {
      // Check if customer_code column exists
      const tableInfo = await this.env.DB.prepare(`
        PRAGMA table_info(customers)
      `).all();

      const columns = tableInfo.results?.map((row: any) => row.name) || [];

      // Add customer_code column if it doesn't exist
      if (!columns.includes('customer_code')) {
        console.log('Adding customer_code column...');
        await this.env.DB.prepare(`
          ALTER TABLE customers ADD COLUMN customer_code TEXT
        `).run();

        // Generate customer codes for existing customers
        const existingCustomers = await this.env.DB.prepare(`
          SELECT id FROM customers WHERE customer_code IS NULL
        `).all();

        for (const customer of existingCustomers.results || []) {
          const customerCode = `CUST${String(customer.id).padStart(6, '0')}`;
          await this.env.DB.prepare(`
            UPDATE customers SET customer_code = ? WHERE id = ?
          `).bind(customerCode, customer.id).run();
        }

        // Make customer_code unique after populating
        await this.env.DB.prepare(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_code_unique ON customers (customer_code)
        `).run();
      }

      // Add other missing columns as needed
      const requiredColumns = [
        'customer_type',
        'company_name',
        'tax_number',
        'is_vip',
        'vip_level',
        'credit_limit',
        'current_balance',
        'total_spent',
        'total_orders',
        'average_order_value',
        'last_order_date',
        'registration_date',
        'is_active',
        'preferences',
        'tags',
        'created_by',
        'updated_by'
      ];

      for (const column of requiredColumns) {
        if (!columns.includes(column)) {
          console.log(`Adding ${column} column...`);
          let columnDef = '';

          switch (column) {
            case 'customer_type':
              columnDef = 'TEXT NOT NULL DEFAULT "individual"';
              break;
            case 'is_vip':
            case 'is_active':
              columnDef = 'INTEGER NOT NULL DEFAULT 0';
              break;
            case 'total_spent':
            case 'credit_limit':
            case 'current_balance':
            case 'average_order_value':
              columnDef = 'REAL NOT NULL DEFAULT 0';
              break;
            case 'total_orders':
            case 'created_by':
            case 'updated_by':
              columnDef = 'INTEGER DEFAULT NULL';
              break;
            case 'registration_date':
              columnDef = 'DATETIME DEFAULT NULL';
              break;
            default:
              columnDef = 'TEXT DEFAULT NULL';
          }

          await this.env.DB.prepare(`
            ALTER TABLE customers ADD COLUMN ${column} ${columnDef}
          `).run();
        }
      }

      console.log('Customer migrations completed successfully');
    } catch (error) {
      console.error('Error running customer migrations:', error);
      throw error;
    }
  }

  // Create database indexes
  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers (customer_code)',
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email)',
      'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone)',
      'CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers (is_active)',
      'CREATE INDEX IF NOT EXISTS idx_customers_is_vip ON customers (is_vip)',
      'CREATE INDEX IF NOT EXISTS idx_customers_city ON customers (city)',
      'CREATE INDEX IF NOT EXISTS idx_customers_registration_date ON customers (registration_date)',
      'CREATE INDEX IF NOT EXISTS idx_customers_last_order_date ON customers (last_order_date)',
      'CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_id ON loyalty_transactions (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions (created_at)',
      'CREATE INDEX IF NOT EXISTS idx_customer_group_memberships_customer_id ON customer_group_memberships (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_customer_group_memberships_group_id ON customer_group_memberships (group_id)'
    ];

    for (const indexQuery of indexes) {
      await this.env.DB.prepare(indexQuery).run();
    }
  }

  // Create default data
  async createDefaultData(): Promise<void> {
    try {
      // Check if we have any customer groups
      const groupsCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM customer_groups'
      ).first<{ count: number }>();

      if (groupsCount && groupsCount.count === 0) {
        console.log('Creating default customer groups...');
        
        // Create default customer groups
        const groups = [
          { name: 'Khách hàng thường', description: 'Khách hàng mua hàng thường xuyên', discount: 0 },
          { name: 'Khách hàng VIP', description: 'Khách hàng VIP với ưu đãi đặc biệt', discount: 5 },
          { name: 'Khách hàng doanh nghiệp', description: 'Khách hàng là doanh nghiệp', discount: 10 }
        ];

        for (const group of groups) {
          await this.env.DB.prepare(`
            INSERT INTO customer_groups (name, description, discount_percentage, is_active)
            VALUES (?, ?, ?, ?)
          `).bind(group.name, group.description, group.discount, 1).run();
        }

        console.log('Default customer groups created');
      }

      // Check if we have any loyalty programs
      const programsCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM loyalty_programs'
      ).first<{ count: number }>();

      if (programsCount && programsCount.count === 0) {
        console.log('Creating default loyalty program...');
        
        // Create default loyalty program
        await this.env.DB.prepare(`
          INSERT INTO loyalty_programs (
            name, description, points_per_currency, currency_per_point,
            min_points_to_redeem, is_active
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          'Chương trình tích điểm SmartPOS',
          'Tích điểm cho mỗi giao dịch mua hàng',
          1, // 1 point per 1 VND
          1000, // 1000 VND per point when redeeming
          100, // Minimum 100 points to redeem
          1
        ).run();

        console.log('Default loyalty program created');
      }

      // Check if we have any customers
      const customersCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM customers'
      ).first<{ count: number }>();

      if (customersCount && customersCount.count === 0) {
        console.log('Creating sample customer...');
        
        // Create sample customer
        await this.env.DB.prepare(`
          INSERT INTO customers (
            customer_code, full_name, phone, email, customer_type,
            is_active, marketing_consent, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          'CUST-001',
          'Khách hàng mẫu',
          '0123456789',
          'customer@example.com',
          'individual',
          1,
          1,
          1 // Assuming user ID 1 exists
        ).run();

        console.log('Sample customer created');
      }
    } catch (error) {
      console.error('Error creating default customer data:', error);
      // Don't throw error for default data creation
    }
  }

  // Get customer statistics
  async getStats(): Promise<CustomerStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);

      // Basic customer stats
      const basicStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_customers,
          COUNT(CASE WHEN is_vip = 1 THEN 1 END) as vip_customers,
          COALESCE(SUM(loyalty_points), 0) as total_loyalty_points,
          COALESCE(AVG(average_order_value), 0) as average_order_value,
          COALESCE(AVG(total_spent), 0) as customer_lifetime_value
        FROM customers
      `).first<any>();

      // New customers stats
      const newCustomersStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(CASE WHEN DATE(registration_date) = ? THEN 1 END) as new_customers_today,
          COUNT(CASE WHEN registration_date >= ? THEN 1 END) as new_customers_this_week,
          COUNT(CASE WHEN registration_date >= ? THEN 1 END) as new_customers_this_month
        FROM customers
      `).bind(today, weekStart.toISOString().split('T')[0], monthStart.toISOString().split('T')[0]).first<any>();

      // Repeat customer rate
      const repeatCustomerStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(CASE WHEN total_orders > 1 THEN 1 END) * 100.0 / COUNT(*) as repeat_customer_rate
        FROM customers
        WHERE total_orders > 0
      `).first<{ repeat_customer_rate: number }>();

      return {
        total_customers: basicStats?.total_customers || 0,
        active_customers: basicStats?.active_customers || 0,
        vip_customers: basicStats?.vip_customers || 0,
        new_customers_today: newCustomersStats?.new_customers_today || 0,
        new_customers_this_week: newCustomersStats?.new_customers_this_week || 0,
        new_customers_this_month: newCustomersStats?.new_customers_this_month || 0,
        total_loyalty_points: basicStats?.total_loyalty_points || 0,
        average_order_value: basicStats?.average_order_value || 0,
        customer_lifetime_value: basicStats?.customer_lifetime_value || 0,
        repeat_customer_rate: repeatCustomerStats?.repeat_customer_rate || 0,
        customer_acquisition_cost: 0, // Calculate based on marketing spend
        customer_retention_rate: 0, // Calculate based on order history
        top_customers: [],
        customer_segments: [],
        loyalty_program_stats: {
          total_members: basicStats?.total_customers || 0,
          active_members: basicStats?.active_customers || 0,
          points_issued_today: 0,
          points_redeemed_today: 0,
          points_balance: basicStats?.total_loyalty_points || 0,
          redemption_rate: 0
        },
        geographic_distribution: [],
        age_distribution: [],
        gender_distribution: []
      };
    } catch (error) {
      console.error('Error getting customer stats:', error);
      throw new Error('Failed to get customer statistics');
    }
  }

  // Generate unique customer code
  async generateCustomerCode(): Promise<string> {
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as count FROM customers
    `).first<{ count: number }>();

    const sequence = String((count?.count || 0) + 1).padStart(6, '0');
    return `CUST-${sequence}`;
  }

  // Update customer statistics after sale
  async updateCustomerStats(customerId: number, orderAmount: number): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE customers 
        SET 
          total_orders = total_orders + 1,
          total_spent = total_spent + ?,
          average_order_value = total_spent / total_orders,
          last_order_date = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(orderAmount, customerId).run();
    } catch (error) {
      console.error('Error updating customer stats:', error);
      throw error;
    }
  }

  // Add loyalty points
  async addLoyaltyPoints(
    customerId: number, 
    points: number, 
    referenceType: string, 
    referenceId: number, 
    description: string,
    createdBy: number
  ): Promise<void> {
    try {
      // Get current balance
      const customer = await this.env.DB.prepare(
        'SELECT loyalty_points FROM customers WHERE id = ?'
      ).bind(customerId).first<{ loyalty_points: number }>();

      if (!customer) {
        throw new Error('Customer not found');
      }

      const balanceBefore = customer.loyalty_points;
      const balanceAfter = balanceBefore + points;

      // Update customer balance
      await this.env.DB.prepare(`
        UPDATE customers 
        SET loyalty_points = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(balanceAfter, customerId).run();

      // Create loyalty transaction
      await this.env.DB.prepare(`
        INSERT INTO loyalty_transactions (
          customer_id, transaction_type, points, balance_before, balance_after,
          reference_type, reference_id, description, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        customerId, 'earn', points, balanceBefore, balanceAfter,
        referenceType, referenceId, description, createdBy
      ).run();
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      throw error;
    }
  }
}
