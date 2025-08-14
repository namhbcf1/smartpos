import { execSync } from 'child_process';

/**
 * D1 Database Helpers for Real Data Testing
 * These helpers interact with the actual Cloudflare D1 database to get real data for testing
 */

export interface D1User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  active: number;
  created_at: string;
}

export interface D1Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock_quantity: number;
  active: number;
}

export interface D1Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface D1Sale {
  id: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export class D1TestHelpers {
  private static executeD1Query(query: string): any {
    try {
      const result = execSync(
        `npx wrangler d1 execute smartpos-db --command="${query}" --json`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      // Clean the output - remove wrangler warnings and emojis
      const lines = result.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('{'));

      if (jsonLine) {
        const parsed = JSON.parse(jsonLine);
        return parsed[0]?.results || [];
      }

      return [];
    } catch (error) {
      console.error('D1 Query Error:', error);
      return [];
    }
  }

  /**
   * Get all active users from D1 database
   */
  static async getUsers(): Promise<D1User[]> {
    const query = `SELECT id, username, full_name, email, role, active, created_at FROM users WHERE active = 1 ORDER BY id`;
    return this.executeD1Query(query);
  }

  /**
   * Get all active products from D1 database
   */
  static async getProducts(): Promise<D1Product[]> {
    const query = `SELECT id, name, price, category_id, stock_quantity, is_active FROM products WHERE is_active = 1 ORDER BY id LIMIT 10`;
    return this.executeD1Query(query);
  }

  /**
   * Get all customers from D1 database
   */
  static async getCustomers(): Promise<D1Customer[]> {
    const query = `SELECT id, full_name as name, phone, email, address FROM customers ORDER BY id LIMIT 10`;
    return this.executeD1Query(query);
  }

  /**
   * Get recent sales from D1 database
   */
  static async getRecentSales(): Promise<D1Sale[]> {
    const query = `SELECT id, total_amount, payment_method, created_at FROM sales ORDER BY created_at DESC LIMIT 10`;
    return this.executeD1Query(query);
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<{
    users_count: number;
    products_count: number;
    customers_count: number;
    sales_count: number;
  }> {
    const usersCount = this.executeD1Query(`SELECT COUNT(*) as count FROM users WHERE is_active = 1`);
    const productsCount = this.executeD1Query(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`);
    const customersCount = this.executeD1Query(`SELECT COUNT(*) as count FROM customers`);
    const salesCount = this.executeD1Query(`SELECT COUNT(*) as count FROM sales`);

    return {
      users_count: usersCount[0]?.count || 0,
      products_count: productsCount[0]?.count || 0,
      customers_count: customersCount[0]?.count || 0,
      sales_count: salesCount[0]?.count || 0,
    };
  }

  /**
   * Create test data in D1 database if needed
   */
  static async createTestDataIfNeeded(): Promise<void> {
    const stats = await this.getDatabaseStats();
    
    // Create test customers if none exist
    if (stats.customers_count === 0) {
      const createCustomersQuery = `
        INSERT INTO customers (name, phone, email, address) VALUES
        ('Nguyễn Văn A', '0901234567', 'nguyenvana@email.com', 'Hà Nội'),
        ('Trần Thị B', '0912345678', 'tranthib@email.com', 'Hồ Chí Minh'),
        ('Lê Văn C', '0923456789', 'levanc@email.com', 'Đà Nẵng')
      `;
      this.executeD1Query(createCustomersQuery);
    }

    // Create test sales if none exist
    if (stats.sales_count === 0) {
      const products = await this.getProducts();
      if (products.length > 0) {
        const createSaleQuery = `
          INSERT INTO sales (customer_id, total_amount, payment_method, status, created_at) VALUES
          (1, 500000, 'cash', 'completed', datetime('now')),
          (2, 1200000, 'card', 'completed', datetime('now', '-1 day')),
          (3, 750000, 'cash', 'completed', datetime('now', '-2 days'))
        `;
        this.executeD1Query(createSaleQuery);
      }
    }
  }

  /**
   * Get a specific user by username
   */
  static async getUserByUsername(username: string): Promise<D1User | null> {
    const query = `SELECT id, username, full_name, email, role, active, created_at FROM users WHERE username = '${username}' AND active = 1`;
    const results = this.executeD1Query(query);
    return results[0] || null;
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string): Promise<D1Product[]> {
    const query = `SELECT id, name, price, category, stock_quantity, active FROM products WHERE category = '${category}' AND active = 1 ORDER BY name`;
    return this.executeD1Query(query);
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(threshold: number = 10): Promise<D1Product[]> {
    const query = `SELECT id, name, price, category, stock_quantity, active FROM products WHERE stock_quantity <= ${threshold} AND active = 1 ORDER BY stock_quantity ASC`;
    return this.executeD1Query(query);
  }

  /**
   * Get customer purchase history
   */
  static async getCustomerPurchaseHistory(customerId: number): Promise<D1Sale[]> {
    const query = `SELECT id, total_amount, payment_method, created_at FROM sales WHERE customer_id = ${customerId} ORDER BY created_at DESC`;
    return this.executeD1Query(query);
  }

  /**
   * Get sales by date range
   */
  static async getSalesByDateRange(startDate: string, endDate: string): Promise<D1Sale[]> {
    const query = `SELECT id, total_amount, payment_method, created_at FROM sales WHERE DATE(created_at) BETWEEN '${startDate}' AND '${endDate}' ORDER BY created_at DESC`;
    return this.executeD1Query(query);
  }

  /**
   * Get today's sales summary
   */
  static async getTodaysSalesSummary(): Promise<{
    total_sales: number;
    total_amount: number;
    avg_sale_amount: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(AVG(total_amount), 0) as avg_sale_amount
      FROM sales 
      WHERE DATE(created_at) = DATE('now')
    `;
    const results = this.executeD1Query(query);
    return results[0] || { total_sales: 0, total_amount: 0, avg_sale_amount: 0 };
  }

  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const result = this.executeD1Query(`SELECT 1 as test`);
      return result.length > 0 && result[0].test === 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database info
   */
  static async getDatabaseInfo(): Promise<any> {
    try {
      const result = execSync('npx wrangler d1 info smartpos-db', { encoding: 'utf8', stdio: 'pipe' });
      return result;
    } catch (error) {
      console.error('Error getting database info:', error);
      return null;
    }
  }
}

// Export real data generators based on D1 data
export const RealDataGenerators = {
  /**
   * Generate product data based on existing products in D1
   */
  async generateProductFromD1(): Promise<any> {
    const products = await D1TestHelpers.getProducts();
    if (products.length === 0) {
      return {
        name: `Test Product ${Date.now()}`,
        price: 500000,
        category: 'Electronics',
        description: 'Test product from D1',
        stock_quantity: 10,
      };
    }

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    return {
      name: `${randomProduct.name} - Copy ${Date.now()}`,
      price: randomProduct.price + Math.floor(Math.random() * 100000),
      category: randomProduct.category,
      description: `Copy of ${randomProduct.name}`,
      stock_quantity: Math.floor(Math.random() * 50) + 1,
    };
  },

  /**
   * Generate customer data based on existing customers in D1
   */
  async generateCustomerFromD1(): Promise<any> {
    const customers = await D1TestHelpers.getCustomers();
    const timestamp = Date.now();
    
    if (customers.length === 0) {
      return {
        name: `Test Customer ${timestamp}`,
        phone: `090${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        email: `customer${timestamp}@test.com`,
        address: 'Test Address',
      };
    }

    return {
      name: `Test Customer ${timestamp}`,
      phone: `090${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      email: `customer${timestamp}@test.com`,
      address: 'Test Address Based on D1 Data',
    };
  },

  /**
   * Generate sale data based on existing products and customers in D1
   */
  async generateSaleFromD1(): Promise<any> {
    const products = await D1TestHelpers.getProducts();
    const customers = await D1TestHelpers.getCustomers();
    
    if (products.length === 0) {
      return {
        items: [],
        total_amount: 0,
        payment_method: 'cash',
      };
    }

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    
    return {
      items: [
        {
          product_id: randomProduct.id,
          quantity,
          price: randomProduct.price,
          total: randomProduct.price * quantity,
        }
      ],
      customer_id: customers.length > 0 ? customers[0].id : null,
      total_amount: randomProduct.price * quantity,
      payment_method: Math.random() > 0.5 ? 'cash' : 'card',
    };
  }
};
