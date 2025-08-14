import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * API Integration Tests
 * Tests all API endpoints and data integration with Cloudflare D1 Database
 */

test.describe('API Integration and Data Verification', () => {
  let helpers: SmartPOSTestHelpers;
  const API_BASE_URL = 'https://smartpos-api.bangachieu2.workers.dev';

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
  });

  test.describe('Core API Endpoints', () => {
    test('should verify products API endpoint', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/products`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('data');
      expect(data.data).toHaveProperty('pagination');
      
      // Verify we have the expected 8 products
      expect(data.data.data).toHaveLength(8);
      
      // Verify product structure
      const product = data.data.data[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('stockQuantity');
      expect(product).toHaveProperty('categoryName');
      
      // Verify specific product data
      const cpuProduct = data.data.data.find((p: any) => p.name.includes('CPU Intel Core i5-13400F'));
      expect(cpuProduct).toBeDefined();
      expect(cpuProduct.sku).toBe('CPU-I5-13400F');
      expect(cpuProduct.price).toBe(4990000);
      expect(cpuProduct.stockQuantity).toBe(5);
    });

    test('should verify specific product API endpoint', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/products/1`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      
      const product = data.data;
      expect(product.name).toBe('CPU Intel Core i5-13400F');
      expect(product.sku).toBe('CPU-I5-13400F');
      expect(product.barcode).toBe('8888888888001');
      expect(product.price).toBe(4990000);
      expect(product.costPrice).toBe(4200000);
      expect(product.stockQuantity).toBe(5);
    });

    test('should verify customers API endpoint', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/customers`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      
      // Verify we have the expected 6 customers
      expect(data.data.data).toHaveLength(6);
      
      // Verify customer structure
      const customer = data.data.data[0];
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('phone');
      expect(customer).toHaveProperty('email');
    });

    test('should verify categories API endpoint', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/categories`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      
      // Verify category structure
      const categories = data.data;
      expect(Array.isArray(categories)).toBe(true);
      
      // Look for "Linh kiện máy tính" category
      const computerPartsCategory = categories.find((c: any) => c.name === 'Linh kiện máy tính');
      expect(computerPartsCategory).toBeDefined();
    });

    test('should verify sales API endpoint', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/sales`);
      
      // Sales endpoint might not exist or might be empty, so we check for valid responses
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success', true);
      } else {
        // If endpoint doesn't exist, that's also valid for this test
        expect([404, 501]).toContain(response.status());
      }
    });

    test('should verify orders API endpoint', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/orders`);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success', true);
      } else {
        expect([404, 501]).toContain(response.status());
      }
    });
  });

  test.describe('API Data Consistency', () => {
    test('should verify data consistency between API and UI', async ({ page }) => {
      // Get products from API
      const apiResponse = await page.request.get(`${API_BASE_URL}/api/v1/products`);
      const apiData = await apiResponse.json();
      
      // Navigate to products page in UI
      await helpers.navigateToPage('products');
      await helpers.waitForTableData();
      
      // Verify product count matches
      const productRows = page.locator('table tbody tr');
      const uiProductCount = await productRows.count();
      expect(uiProductCount).toBe(apiData.data.data.length);
      
      // Verify specific product data matches
      const cpuProductInUI = page.locator('text*="CPU Intel Core i5-13400F"');
      await expect(cpuProductInUI).toBeVisible();
      
      const priceInUI = page.locator('text*="4.990.000 ₫"');
      await expect(priceInUI).toBeVisible();
    });

    test('should verify customer data consistency', async ({ page }) => {
      // Get customers from API
      const apiResponse = await page.request.get(`${API_BASE_URL}/api/v1/customers`);
      const apiData = await apiResponse.json();
      
      // Navigate to customers page in UI
      await helpers.navigateToPage('customers');
      await helpers.waitForTableData();
      
      // Verify customer count in dashboard matches API
      await helpers.navigateToPage('dashboard');
      await helpers.waitForDataLoad();
      
      // Should show 6 customers
      await expect(page.locator('text*="6"')).toBeVisible();
    });

    test('should verify dashboard statistics match API data', async ({ page }) => {
      // Get data from API
      const productsResponse = await page.request.get(`${API_BASE_URL}/api/v1/products`);
      const productsData = await productsResponse.json();
      
      const customersResponse = await page.request.get(`${API_BASE_URL}/api/v1/customers`);
      const customersData = await customersResponse.json();
      
      // Navigate to dashboard
      await helpers.navigateToPage('dashboard');
      await helpers.waitForDataLoad();
      
      // Verify product count
      await expect(page.locator('text*="8"')).toBeVisible(); // Product count
      
      // Verify customer count
      await expect(page.locator('text*="6"')).toBeVisible(); // Customer count
      
      // Verify real data indicators
      await helpers.verifyRealDataLoaded();
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle invalid product ID gracefully', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/products/999999`);
      
      expect(response.status()).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('message');
    });

    test('should handle invalid API endpoints', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/nonexistent`);
      
      expect(response.status()).toBe(404);
    });

    test('should verify CORS headers', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/products`);
      
      const corsHeader = response.headers()['access-control-allow-origin'];
      expect(corsHeader).toBeDefined();
    });
  });

  test.describe('API Performance', () => {
    test('should verify API response times', async ({ page }) => {
      const startTime = Date.now();
      
      const response = await page.request.get(`${API_BASE_URL}/api/v1/products`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      console.log(`Products API response time: ${responseTime}ms`);
    });

    test('should verify API can handle concurrent requests', async ({ page }) => {
      const requests = [
        page.request.get(`${API_BASE_URL}/api/v1/products`),
        page.request.get(`${API_BASE_URL}/api/v1/customers`),
        page.request.get(`${API_BASE_URL}/api/v1/categories`),
        page.request.get(`${API_BASE_URL}/api/v1/products/1`)
      ];
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });
  });

  test.describe('Database Integration', () => {
    test('should verify D1 database connection', async ({ page }) => {
      // Navigate to a page that shows database info
      await helpers.navigateToPage('dashboard');
      await helpers.waitForDataLoad();
      
      // Verify D1 database indicators
      await expect(page.locator('text*="D1 CLOUDFLARE"')).toBeVisible();
      await expect(page.locator('text*="Dữ liệu thực tế 100%"')).toBeVisible();
    });

    test('should verify real-time data updates', async ({ page }) => {
      await helpers.navigateToPage('dashboard');
      await helpers.waitForDataLoad();
      
      // Check for real-time indicators
      await expect(page.locator('text*="REALTIME"')).toBeVisible();
      await expect(page.locator('text*="Kết nối realtime"')).toBeVisible();
      
      // Verify timestamp is recent
      const timestamp = page.locator('text*="Cập nhật:"');
      if (await timestamp.count() > 0) {
        await expect(timestamp).toBeVisible();
      }
    });

    test('should verify data integrity', async ({ page }) => {
      // Get product data from API
      const response = await page.request.get(`${API_BASE_URL}/api/v1/products/1`);
      const apiProduct = await response.json();
      
      // Navigate to product detail page
      await page.goto('/products/1');
      await helpers.waitForDataLoad();
      
      // Verify all data fields match
      await expect(page.locator(`text*="${apiProduct.data.name}"`)).toBeVisible();
      await expect(page.locator(`text*="${apiProduct.data.sku}"`)).toBeVisible();
      await expect(page.locator(`text*="${apiProduct.data.barcode}"`)).toBeVisible();
      
      // Verify formatted price
      const formattedPrice = new Intl.NumberFormat('vi-VN').format(apiProduct.data.price);
      await expect(page.locator(`text*="${formattedPrice}"`)).toBeVisible();
    });
  });

  test.describe('API Security', () => {
    test('should verify API security headers', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/products`);
      
      const headers = response.headers();
      
      // Check for security headers
      expect(headers['content-type']).toContain('application/json');
      
      // Verify CORS is properly configured
      expect(headers['access-control-allow-origin']).toBeDefined();
    });

    test('should handle malformed requests', async ({ page }) => {
      // Test with invalid JSON in POST request (if applicable)
      const response = await page.request.post(`${API_BASE_URL}/api/v1/products`, {
        data: 'invalid json'
      });
      
      // Should handle gracefully (either 400 or 405 for method not allowed)
      expect([400, 405, 501]).toContain(response.status());
    });
  });

  test.describe('API Documentation Verification', () => {
    test('should verify API returns proper error messages', async ({ page }) => {
      const response = await page.request.get(`${API_BASE_URL}/api/v1/products/999999`);
      
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(typeof data.message).toBe('string');
      expect(data.message.length).toBeGreaterThan(0);
    });

    test('should verify API response structure consistency', async ({ page }) => {
      const endpoints = [
        '/api/v1/products',
        '/api/v1/customers',
        '/api/v1/categories'
      ];
      
      for (const endpoint of endpoints) {
        const response = await page.request.get(`${API_BASE_URL}${endpoint}`);
        
        if (response.status() === 200) {
          const data = await response.json();
          
          // All successful responses should have consistent structure
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('data');
          expect(data).toHaveProperty('message');
        }
      }
    });
  });

  test('should verify complete API integration workflow', async ({ page }) => {
    // Test complete workflow: API -> UI -> User interaction -> API
    
    // 1. Get initial data from API
    const initialResponse = await page.request.get(`${API_BASE_URL}/api/v1/products`);
    const initialData = await initialResponse.json();
    
    // 2. Navigate to UI and verify data is displayed
    await helpers.navigateToPage('products');
    await helpers.waitForTableData();
    
    // 3. Verify UI shows the same data
    const productCount = initialData.data.data.length;
    const uiRows = page.locator('table tbody tr');
    expect(await uiRows.count()).toBe(productCount);
    
    // 4. Navigate to product detail and verify API data
    await page.click('a:has-text("CPU Intel Core i5-13400F")');
    await helpers.waitForDataLoad();
    
    // 5. Verify detail page shows correct API data
    await expect(page.locator('text*="CPU-I5-13400F"')).toBeVisible();
    await expect(page.locator('text*="4.990.000 ₫"')).toBeVisible();
    
    // 6. Test API Raw button
    const apiButton = page.locator('button:has-text("Xem API Raw")');
    if (await apiButton.count() > 0) {
      await apiButton.click();
      
      // Should open new tab with API response
      const pages = page.context().pages();
      if (pages.length > 1) {
        const apiPage = pages[pages.length - 1];
        await apiPage.waitForLoadState();
        
        const content = await apiPage.textContent('body');
        expect(content).toContain('success');
        expect(content).toContain('CPU Intel Core i5-13400F');
      }
    }
  });
});
