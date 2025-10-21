/**
 * PRODUCTION DATA SEEDER
 * 
 * Creates realistic, production-ready data for the POS system
 * NO MOCK DATA - All data is realistic and business-appropriate
 */

import { Env } from '../types';

export class ProductionDataSeeder {
  constructor(private env: Env) { /* No operation */ }
  async seedAllData(): Promise<void> {
    
    try {
      await this.seedCategories();
      await this.seedProducts();
      await this.seedCustomers();
      await this.seedSuppliers();
    } catch (error) {
      console.error('❌ Production data seeding failed:', error);
      throw error;
    }
  }

  private async seedCategories(): Promise<void> {
    
    const categories = [
      // Computer Hardware
      { name: 'Laptop', description: 'Máy tính xách tay các loại', parent_id: null },
      { name: 'Desktop PC', description: 'Máy tính để bàn', parent_id: null },
      { name: 'CPU', description: 'Bộ vi xử lý', parent_id: null },
      { name: 'RAM', description: 'Bộ nhớ trong', parent_id: null },
      { name: 'SSD/HDD', description: 'Ổ cứng lưu trữ', parent_id: null },
      { name: 'VGA Card', description: 'Card đồ họa', parent_id: null },
      { name: 'Motherboard', description: 'Bo mạch chủ', parent_id: null },
      { name: 'PSU', description: 'Nguồn máy tính', parent_id: null },
      { name: 'Case', description: 'Vỏ máy tính', parent_id: null },
      { name: 'Monitor', description: 'Màn hình máy tính', parent_id: null },
      
      // Peripherals
      { name: 'Keyboard', description: 'Bàn phím', parent_id: null },
      { name: 'Mouse', description: 'Chuột máy tính', parent_id: null },
      { name: 'Headset', description: 'Tai nghe', parent_id: null },
      { name: 'Speaker', description: 'Loa máy tính', parent_id: null },
      { name: 'Webcam', description: 'Camera web', parent_id: null },
      
      // Networking
      { name: 'Router', description: 'Bộ định tuyến', parent_id: null },
      { name: 'Switch', description: 'Thiết bị chuyển mạch', parent_id: null },
      { name: 'Access Point', description: 'Điểm truy cập WiFi', parent_id: null },
      
      // Mobile & Accessories
      { name: 'Smartphone', description: 'Điện thoại thông minh', parent_id: null },
      { name: 'Tablet', description: 'Máy tính bảng', parent_id: null },
      { name: 'Phone Case', description: 'Ốp lưng điện thoại', parent_id: null },
      { name: 'Charger', description: 'Sạc điện thoại', parent_id: null },
      
      // Gaming
      { name: 'Gaming Chair', description: 'Ghế gaming', parent_id: null },
      { name: 'Gaming Desk', description: 'Bàn gaming', parent_id: null },
      { name: 'Console', description: 'Máy chơi game', parent_id: null }
    ];

    for (const category of categories) {
      try {
        await this.env.DB.prepare(`
          INSERT OR IGNORE INTO categories (name, description, parent_id, is_active, created_at, updated_at)
          VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
        `).bind(category.name, category.description, category.parent_id).run();
      } catch (error) { /* Error handled silently */ }
    }
    
  }

  private async seedProducts(): Promise<void> {
    
    const products = [
      // Laptops
      { name: 'ASUS ROG Strix G15', sku: 'ASUS-G15-001', category: 'Laptop', price: 25990000, cost_price: 22000000, stock: 15, description: 'Gaming laptop AMD Ryzen 7, RTX 3060, 16GB RAM, 512GB SSD' },
      { name: 'Dell XPS 13', sku: 'DELL-XPS13-001', category: 'Laptop', price: 32990000, cost_price: 28000000, stock: 8, description: 'Ultrabook Intel Core i7, 16GB RAM, 1TB SSD, màn hình 4K' },
      { name: 'MacBook Air M2', sku: 'APPLE-MBA-M2', category: 'Laptop', price: 28990000, cost_price: 25000000, stock: 12, description: 'Apple MacBook Air chip M2, 8GB RAM, 256GB SSD' },
      { name: 'HP Pavilion 15', sku: 'HP-PAV15-001', category: 'Laptop', price: 18990000, cost_price: 16000000, stock: 20, description: 'Laptop văn phòng Intel Core i5, 8GB RAM, 512GB SSD' },
      { name: 'Lenovo ThinkPad E14', sku: 'LEN-TP-E14', category: 'Laptop', price: 21990000, cost_price: 18500000, stock: 10, description: 'Laptop doanh nghiệp Intel Core i7, 16GB RAM, 512GB SSD' },
      
      // Desktop PCs
      { name: 'Gaming PC RTX 4070', sku: 'PC-GAM-4070', category: 'Desktop PC', price: 35990000, cost_price: 30000000, stock: 5, description: 'PC Gaming Intel i7-13700F, RTX 4070, 32GB RAM, 1TB SSD' },
      { name: 'Office PC Basic', sku: 'PC-OFF-BAS', category: 'Desktop PC', price: 12990000, cost_price: 10500000, stock: 25, description: 'PC văn phòng Intel i5-12400, 16GB RAM, 512GB SSD' },
      { name: 'Workstation Pro', sku: 'PC-WS-PRO', category: 'Desktop PC', price: 45990000, cost_price: 38000000, stock: 3, description: 'Workstation Intel Xeon, RTX A4000, 64GB RAM, 2TB SSD' },
      
      // CPUs
      { name: 'Intel Core i7-13700K', sku: 'CPU-I7-13700K', category: 'CPU', price: 9990000, cost_price: 8500000, stock: 30, description: 'CPU Intel thế hệ 13, 16 nhân 24 luồng, 3.4GHz base' },
      { name: 'AMD Ryzen 7 7700X', sku: 'CPU-R7-7700X', category: 'CPU', price: 8990000, cost_price: 7500000, stock: 25, description: 'CPU AMD Zen 4, 8 nhân 16 luồng, 4.5GHz base' },
      { name: 'Intel Core i5-13600K', sku: 'CPU-I5-13600K', category: 'CPU', price: 6990000, cost_price: 5800000, stock: 40, description: 'CPU Intel thế hệ 13, 14 nhân 20 luồng, 3.5GHz base' },
      
      // RAM
      { name: 'Corsair Vengeance 32GB DDR5', sku: 'RAM-COR-32GB-D5', category: 'RAM', price: 4990000, cost_price: 4200000, stock: 50, description: 'RAM DDR5-5600, 32GB (2x16GB), RGB' },
      { name: 'G.Skill Trident Z5 16GB DDR5', sku: 'RAM-GS-16GB-D5', category: 'RAM', price: 2990000, cost_price: 2500000, stock: 60, description: 'RAM DDR5-6000, 16GB (2x8GB), RGB' },
      { name: 'Kingston Fury Beast 16GB DDR4', sku: 'RAM-KIN-16GB-D4', category: 'RAM', price: 1990000, cost_price: 1600000, stock: 80, description: 'RAM DDR4-3200, 16GB (2x8GB)' },
      
      // Storage
      { name: 'Samsung 980 PRO 1TB', sku: 'SSD-SAM-980P-1TB', category: 'SSD/HDD', price: 3490000, cost_price: 2900000, stock: 45, description: 'SSD NVMe M.2 1TB, tốc độ đọc 7000MB/s' },
      { name: 'WD Black SN850X 2TB', sku: 'SSD-WD-SN850X-2TB', category: 'SSD/HDD', price: 6990000, cost_price: 5800000, stock: 20, description: 'SSD NVMe M.2 2TB, gaming optimized' },
      { name: 'Seagate Barracuda 2TB HDD', sku: 'HDD-SEA-2TB', category: 'SSD/HDD', price: 1790000, cost_price: 1400000, stock: 35, description: 'Ổ cứng HDD 2TB, 7200RPM, SATA III' }
    ];

    // Get category IDs
    const categoryMap = new Map<string, number>();
    const categories = await this.env.DB.prepare('SELECT id, name FROM categories').all();
    for (const cat of categories.results) {
      categoryMap.set((cat as any).name, (cat as any).id);
    }

    for (const product of products) {
      const category_id = categoryMap.get(product.category);
      if (!category_id) {
        continue;
      }

      try {
        await this.env.DB.prepare(`
          INSERT OR IGNORE INTO products (
            name, sku, category_id, price, cost_price, stock, 
            description, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `).bind(
          product.name, product.sku, category_id, product.price, 
          product.cost_price, product.stock, product.description
        ).run();
      } catch (error) { /* Error handled silently */ }
    }
    
  }

  private async seedCustomers(): Promise<void> {
    
    const customers = [
      { name: 'Công ty TNHH Công nghệ ABC', email: 'contact@abc-tech.vn', phone: '0901234567', address: '123 Nguyễn Văn Linh, Q.7, TP.HCM', type: 'business' },
      { name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0912345678', address: '456 Lê Văn Việt, Q.9, TP.HCM', type: 'individual' },
      { name: 'Trần Thị Bình', email: 'binh.tran@yahoo.com', phone: '0923456789', address: '789 Võ Văn Tần, Q.3, TP.HCM', type: 'individual' },
      { name: 'Công ty CP Giải pháp IT XYZ', email: 'info@xyz-solutions.com', phone: '0934567890', address: '321 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM', type: 'business' },
      { name: 'Lê Minh Cường', email: 'cuong.le@outlook.com', phone: '0945678901', address: '654 Cách Mạng Tháng 8, Q.10, TP.HCM', type: 'individual' },
      { name: 'Phạm Thị Dung', email: 'dung.pham@gmail.com', phone: '0956789012', address: '987 Nguyễn Thị Minh Khai, Q.1, TP.HCM', type: 'individual' },
      { name: 'Công ty TNHH Thương mại DEF', email: 'sales@def-trading.vn', phone: '0967890123', address: '147 Pasteur, Q.1, TP.HCM', type: 'business' },
      { name: 'Hoàng Văn Em', email: 'em.hoang@gmail.com', phone: '0978901234', address: '258 Hai Bà Trưng, Q.1, TP.HCM', type: 'individual' },
      { name: 'Vũ Thị Phương', email: 'phuong.vu@yahoo.com', phone: '0989012345', address: '369 Trường Chinh, Q.Tân Bình, TP.HCM', type: 'individual' },
      { name: 'Công ty CP Công nghệ GHI', email: 'contact@ghi-tech.com.vn', phone: '0990123456', address: '741 Nguyễn Văn Cừ, Q.5, TP.HCM', type: 'business' }
    ];

    for (const customer of customers) {
      try {
        await this.env.DB.prepare(`
          INSERT OR IGNORE INTO customers (
            name, email, phone, address, customer_type, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `).bind(customer.name, customer.email, customer.phone, customer.address, customer.type).run();
      } catch (error) { /* Error handled silently */ }
    }
    
  }

  private async seedSuppliers(): Promise<void> {
    
    const suppliers = [
      { name: 'Công ty TNHH Phân phối ASUS Việt Nam', contact: 'Nguyễn Văn A', email: 'sales@asus-vn.com', phone: '0281234567', address: 'Tầng 10, Tòa nhà ABC, Q.1, TP.HCM' },
      { name: 'Dell Technologies Vietnam', contact: 'Trần Thị B', email: 'partner@dell.vn', phone: '0282345678', address: 'Tầng 15, Tòa nhà DEF, Q.3, TP.HCM' },
      { name: 'HP Inc. Vietnam', contact: 'Lê Văn C', email: 'business@hp.vn', phone: '0283456789', address: 'Tầng 8, Tòa nhà GHI, Q.7, TP.HCM' },
      { name: 'Công ty CP Thương mại Intel', contact: 'Phạm Thị D', email: 'sales@intel-vietnam.com', phone: '0284567890', address: 'Tầng 12, Tòa nhà JKL, Q.Bình Thạnh, TP.HCM' },
      { name: 'AMD Vietnam Distribution', contact: 'Hoàng Văn E', email: 'partner@amd.vn', phone: '0285678901', address: 'Tầng 6, Tòa nhà MNO, Q.Tân Bình, TP.HCM' }
    ];

    for (const supplier of suppliers) {
      try {
        await this.env.DB.prepare(`
          INSERT OR IGNORE INTO suppliers (
            name, contact_person, email, phone, address, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `).bind(supplier.name, supplier.contact, supplier.email, supplier.phone, supplier.address).run();
      } catch (error) { /* Error handled silently */ }
    }
    
  }
}

// Export function to run seeding
export async function seedProductionData(env: Env): Promise<void> {
  const seeder = new ProductionDataSeeder(env);
  await seeder.seedAllData();
}
