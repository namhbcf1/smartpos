import { test, expect } from '@playwright/test';

/**
 * 🔍 API Data Test
 * Testing API data format
 */

const API_URL = 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev';

test.describe('🔍 API Data Test', () => {
  
  test('🔍 Test Dashboard API Data', async ({ page }) => {
    console.log('🔍 Testing dashboard API data...');
    
    // Test dashboard API directly
    const dashboardResult = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/analytics/dashboard');
        const data = await response.text();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Dashboard API result:', dashboardResult);
    
    if (dashboardResult.status === 200) {
      const dashboardData = JSON.parse(dashboardResult.data);
      console.log('Dashboard data structure:', JSON.stringify(dashboardData, null, 2));
      
      // Check if data has required fields
      if (dashboardData.data) {
        const data = dashboardData.data;
        console.log('Data fields:', Object.keys(data));
        
        // Check for numeric fields that might cause toLocaleString error
        const numericFields = ['todaySales', 'todayRevenue', 'totalCustomers', 'totalProducts', 'lowStockProducts'];
        for (const field of numericFields) {
          console.log(`${field}:`, data[field], 'type:', typeof data[field]);
          if (data[field] === null || data[field] === undefined) {
            console.log(`⚠️ WARNING: ${field} is ${data[field]}`);
          }
        }
      }
    }
  });

  test('🔍 Test Products API Data', async ({ page }) => {
    console.log('🔍 Testing products API data...');
    
    // Test products API directly
    const productsResult = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/products');
        const data = await response.text();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Products API result:', productsResult);
    
    if (productsResult.status === 200) {
      const productsData = JSON.parse(productsResult.data);
      console.log('Products data structure:', JSON.stringify(productsData, null, 2));
    }
  });

  test('🔍 Test Sales API Data', async ({ page }) => {
    console.log('🔍 Testing sales API data...');
    
    // Test sales API directly
    const salesResult = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/sales');
        const data = await response.text();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Sales API result:', salesResult);
    
    if (salesResult.status === 200) {
      const salesData = JSON.parse(salesResult.data);
      console.log('Sales data structure:', JSON.stringify(salesData, null, 2));
    }
  });

  test('🔍 Test Customers API Data', async ({ page }) => {
    console.log('🔍 Testing customers API data...');
    
    // Test customers API directly
    const customersResult = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/customers');
        const data = await response.text();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Customers API result:', customersResult);
    
    if (customersResult.status === 200) {
      const customersData = JSON.parse(customersResult.data);
      console.log('Customers data structure:', JSON.stringify(customersData, null, 2));
    }
  });
});
