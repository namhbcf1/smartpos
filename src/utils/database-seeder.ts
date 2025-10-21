/**
 * Database Seeder - Tự động tạo dữ liệu mẫu nếu database trống
 * Thay thế cho các endpoint test đơn giản
 */

import { Env } from '../types';

export class DatabaseSeeder {
  constructor(private env: Env) { /* No operation */ }
  /**
   * Kiểm tra và tạo dữ liệu mẫu nếu cần thiết
   */
  async seedIfEmpty(): Promise<void> {
    try {
      
      // Kiểm tra xem có dữ liệu không
      const isEmpty = await this.isDatabaseEmpty();
      if (isEmpty) {
        await this.createSampleData();
      } else { /* No operation */ }
    } catch (error) {
      console.error('❌ Database seeding error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem database có trống không
   */
  private async isDatabaseEmpty(): Promise<boolean> {
    try {
      // Check for users first (most important for authentication)
      const usersCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
      ).first<{ count: number }>();
      const productsCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM products'
      ).first<{ count: number }>();
      // Database is empty if no active users or no products
      return (usersCount?.count || 0) === 0 || (productsCount?.count || 0) === 0;
    } catch (error) {
      // If tables don't exist, database is empty
      return true;
    }
  }

  /**
   * Tạo dữ liệu mẫu cho hệ thống POS
   */
  private async createSampleData(): Promise<void> {
    // Tạo admin user FIRST (most important for authentication)
    await this.createAdminUser();
    // Tạo categories
    await this.createCategories();
    // Tạo products
    await this.createProducts();
    // Tạo customers
    await this.createCustomers();
    // Tạo suppliers
    await this.createSuppliers();
  }

  /**
   * Tạo danh mục sản phẩm
   */
  private async createCategories(): Promise<void> {
    const categories = [
      { id: 1, name: 'CPU - Bộ vi xử lý', description: 'CPU Intel, AMD các loại' },
      { id: 2, name: 'RAM - Bộ nhớ', description: 'RAM DDR4, DDR5 các hãng' },
      { id: 3, name: 'VGA - Card đồ họa', description: 'Card đồ họa NVIDIA, AMD' },
      { id: 4, name: 'Mainboard - Bo mạch chủ', description: 'Mainboard Intel, AMD' },
      { id: 5, name: 'SSD - Ổ cứng', description: 'SSD NVMe, SATA các loại' },
      { id: 6, name: 'Laptop', description: 'Laptop gaming, văn phòng' },
      { id: 7, name: 'Phụ kiện', description: 'Chuột, bàn phím, tai nghe' }
    ];

    for (const category of categories) {
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO categories (id, name, description, is_active, created_at)
        VALUES (?, ?, ?, 1, datetime('now'))
      `).bind(category.id, category.name, category.description).run();
    }
  }

  /**
   * Tạo sản phẩm mẫu
   */
  private async createProducts(): Promise<void> {
    const products = [
      {
        id: 1,
        name: 'CPU Intel Core i5-13400F',
        description: 'CPU Intel Core i5-13400F 2.5GHz up to 4.6GHz, 10 cores 16 threads',
        sku: 'CPU-I5-13400F',
        barcode: '8888888888001',
        category_id: 1,
        price: 4990000,
        cost_price: 4200000,
        stock: 15
      },
      {
        id: 2,
        name: 'RAM Kingston Fury 16GB DDR4',
        description: 'RAM Kingston Fury Beast 16GB DDR4 3200MHz CL16',
        sku: 'RAM-KF-16GB-DDR4',
        barcode: '8888888888002',
        category_id: 2,
        price: 1590000,
        cost_price: 1350000,
        stock: 25
      },
      {
        id: 3,
        name: 'VGA RTX 4060 Ti 16GB',
        description: 'NVIDIA GeForce RTX 4060 Ti 16GB GDDR6',
        sku: 'VGA-RTX-4060TI-16GB',
        barcode: '8888888888003',
        category_id: 3,
        price: 12990000,
        cost_price: 11500000,
        stock: 8
      },
      {
        id: 4,
        name: 'Mainboard ASUS B760M',
        description: 'ASUS PRIME B760M-A WIFI DDR4 Socket LGA1700',
        sku: 'MB-ASUS-B760M',
        barcode: '8888888888004',
        category_id: 4,
        price: 2890000,
        cost_price: 2500000,
        stock: 12
      },
      {
        id: 5,
        name: 'SSD Samsung 980 1TB',
        description: 'SSD Samsung 980 1TB NVMe M.2 PCIe 3.0',
        sku: 'SSD-SS-980-1TB',
        barcode: '8888888888005',
        category_id: 5,
        price: 2190000,
        cost_price: 1900000,
        stock: 20
      }
    ];

    for (const product of products) {
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO products (
          id, name, description, sku, barcode, category_id, 
          price, cost_price, stock, min_stock, 
          tax_rate, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 5, 10.0, 1, datetime('now'), datetime('now'))
      `).bind(
        product.id, product.name, product.description, product.sku,
        product.barcode, product.category_id, product.price, 
        product.cost_price, product.stock
      ).run();
    }
  }

  /**
   * Tạo khách hàng mẫu
   */
  private async createCustomers(): Promise<void> {
    const customers = [
      {
        id: 1,
        full_name: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'nguyenvanan@email.com',
        address: '123 Đường ABC, Quận 1, TP.HCM'
      },
      {
        id: 2,
        full_name: 'Trần Thị Bình',
        phone: '0907654321',
        email: 'tranthibinh@email.com',
        address: '456 Đường XYZ, Quận 3, TP.HCM'
      }
    ];

    for (const customer of customers) {
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO customers (
          id, full_name, phone, email, address, 
          loyalty_points, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, 1, datetime('now'), datetime('now'))
      `).bind(
        customer.id, customer.full_name, customer.phone, 
        customer.email, customer.address
      ).run();
    }
  }

  /**
   * Tạo nhà cung cấp mẫu
   */
  private async createSuppliers(): Promise<void> {
    const suppliers = [
      {
        id: 1,
        name: 'Công ty TNHH Linh kiện ABC',
        code: 'SUP-ABC',
        contact_person: 'Nguyễn Văn Supplier',
        phone: '0281234567',
        email: 'contact@abc-computer.com',
        address: '789 Đường Supplier, Quận 7, TP.HCM'
      }
    ];

    for (const supplier of suppliers) {
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO suppliers (
          id, name, code, contact_person, phone, email, address,
          payment_terms, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Thanh toán trong 30 ngày', 1, datetime('now'), datetime('now'))
      `).bind(
        supplier.id, supplier.name, supplier.code, supplier.contact_person,
        supplier.phone, supplier.email, supplier.address
      ).run();
    }
  }

  /**
   * Tạo admin user mặc định với schema chính xác
   */
  private async createAdminUser(): Promise<void> {
    try {
      // Ensure users table exists with correct schema
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'inventory')),
          store_id TEXT DEFAULT 'store1',
          is_active INTEGER NOT NULL DEFAULT 1,
          last_login_at TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
          deleted_at INTEGER DEFAULT NULL,
          created_by TEXT NOT NULL DEFAULT 'system',
          updated_by TEXT NOT NULL DEFAULT 'system',
          version INTEGER NOT NULL DEFAULT 1
        )
      `).run();
      // Ensure stores table exists
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS stores (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          address TEXT,
          phone TEXT,
          email TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
          created_by TEXT NOT NULL DEFAULT 'system',
          updated_by TEXT NOT NULL DEFAULT 'system'
        )
      `).run();
      // Create default store
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO stores (id, name, code, address, phone, email, is_active, created_by, updated_by)
        VALUES ('store1', 'Cửa hàng chính', 'MAIN', '123 Đường ABC, Quận 1, TP.HCM', '0123456789', 'info@computerpos.vn', 1, 'system', 'system')
      `).run();
      const adminExists = await this.env.DB.prepare(
        'SELECT id FROM users WHERE username = ?'
      ).bind('admin').first();
      if (!adminExists) {

        await this.env.DB.prepare(`
          INSERT INTO users (
            id, username, email, password_hash, full_name, role,
            store_id, is_active, created_by, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'system', 'system')
        `).bind(
          'admin1',
          'admin',
          'admin@computerpos.vn',
          '123456', // Simple password for easy login
          'Quản trị viên hệ thống',
          'admin',
          'store1'
        ).run();
      } else { /* No operation */ }
    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      // Continue even if admin creation fails
    }
  }
}
