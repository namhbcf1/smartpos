import { Env } from '../../types';
import { Product, ProductCreateData, ProductUpdateData, ProductQueryParams, ProductStats } from './types';

export class ProductDatabase {
  constructor(private env: Env) {}

  // Initialize database tables
  async initializeTables(): Promise<void> {
    try {
      // Create categories table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          parent_id INTEGER,
          slug TEXT UNIQUE,
          image_url TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          deleted_at DATETIME,
          FOREIGN KEY (parent_id) REFERENCES categories(id)
        )
      `).run();

      // Create products table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          short_description TEXT,
          sku TEXT NOT NULL UNIQUE,
          barcode TEXT UNIQUE,
          category_id INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          wholesale_price DECIMAL(10,2),
          retail_price DECIMAL(10,2),
          tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          stock_alert_threshold INTEGER NOT NULL DEFAULT 0,
          min_stock_level INTEGER DEFAULT 0,
          max_stock_level INTEGER,
          reorder_point INTEGER,
          unit TEXT DEFAULT 'pcs',
          weight DECIMAL(8,2),
          dimensions TEXT,
          brand TEXT,
          model TEXT,
          supplier_id INTEGER,
          warranty_period INTEGER,
          warranty_type TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          is_featured INTEGER NOT NULL DEFAULT 0,
          is_digital INTEGER NOT NULL DEFAULT 0,
          track_inventory INTEGER NOT NULL DEFAULT 1,
          allow_backorder INTEGER NOT NULL DEFAULT 0,
          image_url TEXT,
          images TEXT, -- JSON array of image URLs
          tags TEXT, -- JSON array of tags
          total_sold INTEGER DEFAULT 0,
          revenue_generated DECIMAL(12,2) DEFAULT 0,
          last_sold_date DATETIME,
          last_restocked_date DATETIME,
          average_rating DECIMAL(3,2) DEFAULT 0,
          review_count INTEGER DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          deleted_at DATETIME,
          created_by INTEGER,
          updated_by INTEGER,
          FOREIGN KEY (category_id) REFERENCES categories(id),
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        )
      `).run();

      // Create product variants table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS product_variants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          sku TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          cost_price DECIMAL(10,2),
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          attributes TEXT, -- JSON object of variant attributes
          image_url TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `).run();

      // Create product attributes table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS product_attributes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          value TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'text',
          is_required INTEGER NOT NULL DEFAULT 0,
          is_variant INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `).run();

      // Create product images table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS product_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          url TEXT NOT NULL,
          alt_text TEXT,
          is_primary INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `).run();

      // Create product tags table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS product_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          color TEXT,
          description TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Create product_tag_relations table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS product_tag_relations (
          product_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (product_id, tag_id),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES product_tags(id) ON DELETE CASCADE
        )
      `).run();

      // Create stock movements table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'transfer'
          quantity INTEGER NOT NULL,
          reference_type TEXT, -- 'sale', 'purchase', 'return', 'adjustment', 'transfer'
          reference_id INTEGER,
          notes TEXT,
          created_by INTEGER NOT NULL,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `).run();

      // Create indexes for better performance
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type)`).run();

      console.log('Product database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing product database tables:', error);
      throw error;
    }
  }

  // Initialize essential data - production ready
  async initializeEssentialData(): Promise<void> {
    try {
      // Check if categories exist
      const categoryCount = await this.env.DB.prepare('SELECT COUNT(*) as count FROM categories WHERE deleted_at IS NULL').first<{ count: number }>();

      if (!categoryCount || categoryCount.count === 0) {
        console.log('Creating sample categories...');

        const categories = [
          { name: 'Máy tính để bàn', description: 'Máy tính để bàn và workstation', slug: 'may-tinh-de-ban' },
          { name: 'Laptop', description: 'Máy tính xách tay các loại', slug: 'laptop' },
          { name: 'Linh kiện', description: 'Linh kiện máy tính', slug: 'linh-kien' },
          { name: 'Phụ kiện', description: 'Phụ kiện máy tính', slug: 'phu-kien' },
          { name: 'Gaming', description: 'Sản phẩm gaming chuyên dụng', slug: 'gaming' }
        ];

        for (const category of categories) {
          await this.env.DB.prepare(`
            INSERT INTO categories (name, description, slug, is_active)
            VALUES (?, ?, ?, ?)
          `).bind(category.name, category.description, category.slug, 1).run();
        }
      }

      // Check if products exist
      const productCount = await this.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL').first<{ count: number }>();

      if (!productCount || productCount.count === 0) {
        console.log('Creating sample products...');

        const products = [
          {
            name: 'PC Gaming RTX 4060',
            description: 'Máy tính gaming với card RTX 4060, CPU i5-12400F, RAM 16GB, SSD 500GB',
            sku: 'PC-RTX4060-001',
            barcode: '8934567890123',
            category_id: 1,
            price: 25000000,
            cost_price: 20000000,
            stock_quantity: 10,
            stock_alert_threshold: 2,
            brand: 'Custom Build',
            is_featured: 1
          },
          {
            name: 'Laptop Dell Inspiron 15',
            description: 'Laptop Dell Inspiron 15 3000, CPU i5-1135G7, RAM 8GB, SSD 256GB',
            sku: 'DELL-INS15-001',
            barcode: '8934567890124',
            category_id: 2,
            price: 15000000,
            cost_price: 12000000,
            stock_quantity: 15,
            stock_alert_threshold: 3,
            brand: 'Dell'
          },
          {
            name: 'CPU Intel Core i5-12400F',
            description: 'Bộ vi xử lý Intel Core i5-12400F, 6 cores 12 threads, 2.5GHz base clock',
            sku: 'CPU-I5-12400F',
            barcode: '8934567890125',
            category_id: 3,
            price: 4500000,
            cost_price: 3800000,
            stock_quantity: 25,
            stock_alert_threshold: 5,
            brand: 'Intel'
          }
        ];

        for (const product of products) {
          await this.env.DB.prepare(`
            INSERT INTO products (
              name, description, sku, barcode, category_id, price, cost_price, 
              stock_quantity, stock_alert_threshold, brand, is_featured, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            product.name, product.description, product.sku, product.barcode,
            product.category_id, product.price, product.cost_price,
            product.stock_quantity, product.stock_alert_threshold,
            product.brand, product.is_featured || 0, 1
          ).run();
        }
      }

      console.log('Essential product data initialized successfully');
    } catch (error) {
      console.error('Error initializing essential product data:', error);
      throw error;
    }
  }

  // Get product statistics
  async getStats(): Promise<ProductStats> {
    try {
      const stats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_products,
          SUM(CASE WHEN stock_quantity <= stock_alert_threshold AND stock_quantity > 0 THEN 1 ELSE 0 END) as low_stock_products,
          SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_products,
          SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_products,
          SUM(price * stock_quantity) as total_value,
          AVG(price) as average_price
        FROM products 
        WHERE deleted_at IS NULL
      `).first<any>();

      const categoriesCount = await this.env.DB.prepare(`
        SELECT COUNT(DISTINCT category_id) as count 
        FROM products 
        WHERE deleted_at IS NULL
      `).first<{ count: number }>();

      const brandsCount = await this.env.DB.prepare(`
        SELECT COUNT(DISTINCT brand) as count 
        FROM products 
        WHERE deleted_at IS NULL AND brand IS NOT NULL
      `).first<{ count: number }>();

      return {
        total_products: stats?.total_products || 0,
        active_products: stats?.active_products || 0,
        inactive_products: stats?.inactive_products || 0,
        low_stock_products: stats?.low_stock_products || 0,
        out_of_stock_products: stats?.out_of_stock_products || 0,
        featured_products: stats?.featured_products || 0,
        total_value: stats?.total_value || 0,
        average_price: stats?.average_price || 0,
        categories_count: categoriesCount?.count || 0,
        brands_count: brandsCount?.count || 0,
        suppliers_count: 0 // Will be implemented when suppliers module is ready
      };
    } catch (error) {
      console.error('Error getting product stats:', error);
      throw error;
    }
  }
}
