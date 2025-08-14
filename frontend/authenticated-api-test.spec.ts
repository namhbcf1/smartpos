import { test, expect } from '@playwright/test';

/**
 * 🔍 Authenticated API Test
 * Testing API with authentication token
 */

const APP_URL = 'https://a31953ab.smartpos-web.pages.dev';

test.describe('🔍 Authenticated API Test', () => {
  
  test('🔍 Test API with Authentication', async ({ page }) => {
    console.log('🔍 Testing API with authentication...');
    
    // First login to get token
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Get token from localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    });
    
    console.log('Token found:', token ? 'Yes' : 'No');
    
    if (token) {
      // Test dashboard API with token
      const dashboardResult = await page.evaluate(async (authToken) => {
        try {
          const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/analytics/dashboard', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.text();
          return { status: response.status, data };
        } catch (error) {
          return { error: error.message };
        }
      }, token);
      
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
      
      // Test customers API with token
      const customersResult = await page.evaluate(async (authToken) => {
        try {
          const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/customers', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.text();
          return { status: response.status, data };
        } catch (error) {
          return { error: error.message };
        }
      }, token);
      
      console.log('Customers API result:', customersResult);
      
      if (customersResult.status === 200) {
        const customersData = JSON.parse(customersResult.data);
        console.log('Customers data structure:', JSON.stringify(customersData, null, 2));
      }
    }
  });
});
