// Global Setup for ComputerPOS Pro Tests
// Vietnamese Computer Hardware POS System Test Setup

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://a66f347c.pos-frontend-bangachieu2.pages.dev';
  
  console.log('🚀 Setting up ComputerPOS Pro test environment...');
  console.log('🌐 Target URL:', baseURL);
  console.log('🇻🇳 Locale: Vietnamese (vi-VN)');
  console.log('💰 Currency: Vietnamese Dong (VND)');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Test if the application is accessible
    console.log('🔍 Checking application accessibility...');
    await page.goto(baseURL, { timeout: 30000 });
    
    // Verify the page loads
    await page.waitForLoadState('networkidle');
    console.log('✅ Application is accessible');
    
    // Seed test data via admin endpoints
    console.log('🌱 Seeding Vietnamese test data...');
    
    // Seed categories (Vietnamese computer hardware categories)
    try {
      const categoriesResponse = await page.request.post(`${baseURL}/admin/seed/categories`, {
        data: {
          categories: [
            { name: 'CPU', name_vi: 'Bộ xử lý', description: 'Central Processing Units' },
            { name: 'GPU', name_vi: 'Card đồ họa', description: 'Graphics Processing Units' },
            { name: 'RAM', name_vi: 'Bộ nhớ RAM', description: 'Random Access Memory' },
            { name: 'MOTHERBOARD', name_vi: 'Bo mạch chủ', description: 'Motherboards' },
            { name: 'STORAGE', name_vi: 'Ổ cứng', description: 'Storage Devices' },
            { name: 'PSU', name_vi: 'Nguồn máy tính', description: 'Power Supply Units' },
            { name: 'CASE', name_vi: 'Vỏ case', description: 'Computer Cases' },
            { name: 'COOLING', name_vi: 'Tản nhiệt', description: 'Cooling Systems' }
          ]
        }
      });
      
      if (categoriesResponse.ok()) {
        console.log('✅ Categories seeded successfully');
      }
    } catch (error) {
      console.log('⚠️ Categories seeding skipped (endpoint may not exist yet)');
    }
    
    // Seed brands (Vietnamese computer hardware brands)
    try {
      const brandsResponse = await page.request.post(`${baseURL}/admin/seed/brands`, {
        data: {
          brands: [
            { name: 'Intel', name_vi: 'Intel', description: 'Intel Corporation' },
            { name: 'AMD', name_vi: 'AMD', description: 'Advanced Micro Devices' },
            { name: 'NVIDIA', name_vi: 'NVIDIA', description: 'NVIDIA Corporation' },
            { name: 'ASUS', name_vi: 'ASUS', description: 'ASUSTeK Computer Inc.' },
            { name: 'MSI', name_vi: 'MSI', description: 'Micro-Star International' },
            { name: 'Gigabyte', name_vi: 'Gigabyte', description: 'Gigabyte Technology' },
            { name: 'Corsair', name_vi: 'Corsair', description: 'Corsair Gaming' },
            { name: 'Samsung', name_vi: 'Samsung', description: 'Samsung Electronics' }
          ]
        }
      });
      
      if (brandsResponse.ok()) {
        console.log('✅ Brands seeded successfully');
      }
    } catch (error) {
      console.log('⚠️ Brands seeding skipped (endpoint may not exist yet)');
    }
    
    // Seed test products (Vietnamese computer hardware)
    try {
      const productsResponse = await page.request.post(`${baseURL}/admin/seed/products`, {
        data: {
          products: [
            {
              name: 'Intel Core i7-13700K',
              name_vi: 'Bộ xử lý Intel Core i7-13700K',
              sku: 'CPU-I7-13700K',
              unit_price: 1299000000, // 12.99M VND in cents
              cost_price: 1100000000,
              stock_quantity: 50,
              category_name: 'CPU',
              brand_name: 'Intel',
              specifications: {
                cores: 16,
                threads: 24,
                base_clock: '3.4 GHz',
                boost_clock: '5.4 GHz',
                socket: 'LGA1700'
              },
              warranty_months: 36
            },
            {
              name: 'NVIDIA GeForce RTX 4070',
              name_vi: 'Card đồ họa NVIDIA GeForce RTX 4070',
              sku: 'GPU-RTX4070',
              unit_price: 1599000000, // 15.99M VND in cents
              cost_price: 1350000000,
              stock_quantity: 25,
              category_name: 'GPU',
              brand_name: 'NVIDIA',
              specifications: {
                memory: '12GB GDDR6X',
                memory_bus: '192-bit',
                boost_clock: '2610 MHz',
                power_consumption: 200
              },
              warranty_months: 24
            },
            {
              name: 'Corsair Vengeance LPX 32GB DDR4-3200',
              name_vi: 'RAM Corsair Vengeance LPX 32GB DDR4-3200',
              sku: 'RAM-CORS-32GB-3200',
              unit_price: 299000000, // 2.99M VND in cents
              cost_price: 250000000,
              stock_quantity: 100,
              category_name: 'RAM',
              brand_name: 'Corsair',
              specifications: {
                capacity: '32GB',
                type: 'DDR4',
                speed: '3200 MHz',
                modules: '2x16GB'
              },
              warranty_months: 60
            }
          ]
        }
      });
      
      if (productsResponse.ok()) {
        console.log('✅ Products seeded successfully');
      }
    } catch (error) {
      console.log('⚠️ Products seeding skipped (endpoint may not exist yet)');
    }
    
    // Seed test customers (Vietnamese customers)
    try {
      const customersResponse = await page.request.post(`${baseURL}/admin/seed/customers`, {
        data: {
          customers: [
            {
              full_name: 'Nguyễn Văn An',
              phone: '0901234567',
              email: 'nguyenvanan@email.com',
              address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
              customer_type: 'individual',
              loyalty_points: 1500
            },
            {
              full_name: 'Trần Thị Bình',
              phone: '0912345678',
              email: 'tranthibinh@email.com',
              address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
              customer_type: 'individual',
              loyalty_points: 2300
            },
            {
              full_name: 'Công ty TNHH ABC',
              phone: '0283456789',
              email: 'info@abc.com.vn',
              address: '789 Đường Điện Biên Phủ, Quận 3, TP.HCM',
              customer_type: 'business',
              tax_number: '0123456789',
              loyalty_points: 5000
            }
          ]
        }
      });
      
      if (customersResponse.ok()) {
        console.log('✅ Customers seeded successfully');
      }
    } catch (error) {
      console.log('⚠️ Customers seeding skipped (endpoint may not exist yet)');
    }
    
    console.log('🎯 Test environment setup completed');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
