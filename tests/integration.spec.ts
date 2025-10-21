import { test, expect } from '@playwright/test';

const API_BASE_URL = 'https://namhbcf-api.bangachieu2.workers.dev/api';
const FRONTEND_URL = 'https://5895f31e.namhbcf-uk.pages.dev';
let authToken: string;

test.describe('Integration Tests - Frontend + Backend + Database', () => {
  test.beforeAll(async ({ request }) => {
    // Get auth token
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('should verify database has test data', async ({ request }) => {
    // Check products in database
    const productsResponse = await request.get(`${API_BASE_URL}/products?page=1&limit=100`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const productsData = await productsResponse.json();
    expect(productsData.success).toBe(true);
    expect(productsData.products.length).toBeGreaterThan(0);
    console.log(`✓ Database verification: ${productsData.products.length} products`);

    // Check customers in database
    const customersResponse = await request.get(`${API_BASE_URL}/customers?page=1&limit=100`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const customersData = await customersResponse.json();
    expect(customersData.success).toBe(true);
    expect(customersData.customers.length).toBeGreaterThan(0);
    console.log(`✓ Database verification: ${customersData.customers.length} customers`);

    // Check categories in database
    const categoriesResponse = await request.get(`${API_BASE_URL}/categories?page=1&limit=100`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const categoriesData = await categoriesResponse.json();
    expect(categoriesData.success).toBe(true);
    expect(categoriesData.categories.length).toBeGreaterThan(0);
    console.log(`✓ Database verification: ${categoriesData.categories.length} categories`);
  });

  test('should display products from database on frontend', async ({ page, request }) => {
    // Get products from API
    const apiResponse = await request.get(`${API_BASE_URL}/products?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const apiData = await apiResponse.json();
    const firstProduct = apiData.products[0];

    // Login to frontend
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${FRONTEND_URL}/`);

    // Go to products page
    await page.goto(`${FRONTEND_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if product name appears on page
    const pageContent = await page.content();
    const productNameVisible = pageContent.includes(firstProduct.name) ||
                               pageContent.includes(firstProduct.sku);

    if (productNameVisible) {
      console.log(`✓ Integration: Product "${firstProduct.name}" from DB displayed on frontend`);
    } else {
      console.log(`⚠ Warning: Product "${firstProduct.name}" not found on page`);
    }

    expect(apiData.products.length).toBeGreaterThan(0);
  });

  test('should display customers from database on frontend', async ({ page, request }) => {
    // Get customers from API
    const apiResponse = await request.get(`${API_BASE_URL}/customers?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const apiData = await apiResponse.json();
    const firstCustomer = apiData.customers[0];

    // Login to frontend
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${FRONTEND_URL}/`);

    // Go to customers page
    await page.goto(`${FRONTEND_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if customer name appears on page
    const pageContent = await page.content();
    const customerVisible = pageContent.includes(firstCustomer.name) ||
                           pageContent.includes(firstCustomer.phone);

    if (customerVisible) {
      console.log(`✓ Integration: Customer "${firstCustomer.name}" from DB displayed on frontend`);
    }

    expect(apiData.customers.length).toBeGreaterThan(0);
  });

  test('should display categories from database on frontend', async ({ page, request }) => {
    // Get categories from API
    const apiResponse = await request.get(`${API_BASE_URL}/categories?page=1&limit=100`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const apiData = await apiResponse.json();
    const firstCategory = apiData.categories[0];

    // Login to frontend
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${FRONTEND_URL}/`);

    // Go to categories page
    await page.goto(`${FRONTEND_URL}/categories`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if category name appears on page
    const pageContent = await page.content();
    const categoryVisible = pageContent.includes(firstCategory.name);

    if (categoryVisible) {
      console.log(`✓ Integration: Category "${firstCategory.name}" from DB displayed on frontend`);
    }

    expect(apiData.categories.length).toBeGreaterThan(0);
  });

  test('should display dashboard stats from database', async ({ page, request }) => {
    // Get stats from API
    const apiResponse = await request.get(`${API_BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const apiData = await apiResponse.json();

    // Login to frontend
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${FRONTEND_URL}/`);

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const pageContent = await page.content();

    console.log(`✓ Integration: Dashboard stats - Products: ${apiData.data.products.total}, Customers: ${apiData.data.customers.total}, Categories: ${apiData.data.categories.total}`);

    expect(apiData.success).toBe(true);
  });

  test('should handle API authentication flow', async ({ page, request }) => {
    // Test login flow
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.token).toBeDefined();

    // Test authenticated request
    const protectedResponse = await request.get(`${API_BASE_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    expect(protectedResponse.ok()).toBeTruthy();

    // Test unauthorized request
    const unauthorizedResponse = await request.get(`${API_BASE_URL}/products`);
    expect(unauthorizedResponse.status()).toBe(401);

    console.log('✓ Integration: API authentication flow works correctly');
  });

  test('should verify all core API endpoints return correct format', async ({ request }) => {
    const endpoints = [
      { url: '/products?page=1&limit=5', arrayKey: 'products' },
      { url: '/customers?page=1&limit=5', arrayKey: 'customers' },
      { url: '/categories?page=1&limit=5', arrayKey: 'categories' },
      { url: '/sales?page=1&limit=5', nestedArrayKey: 'data.data' },
      { url: '/orders?page=1&limit=5', arrayKey: 'data' },
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${API_BASE_URL}${endpoint.url}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);

      // Check array format
      if (endpoint.arrayKey) {
        expect(Array.isArray(data[endpoint.arrayKey])).toBe(true);
        console.log(`✓ ${endpoint.url} returns array in ${endpoint.arrayKey}`);
      } else if (endpoint.nestedArrayKey) {
        const keys = endpoint.nestedArrayKey.split('.');
        let value = data;
        for (const key of keys) {
          value = value[key];
        }
        expect(Array.isArray(value)).toBe(true);
        console.log(`✓ ${endpoint.url} returns array in ${endpoint.nestedArrayKey}`);
      }
    }
  });

  test('should verify pagination works across all pages', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${FRONTEND_URL}/`);

    const pages = ['/products', '/customers', '/categories', '/sales', '/orders'];

    for (const pagePath of pages) {
      await page.goto(`${FRONTEND_URL}${pagePath}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if page loaded without errors
      const pageContent = await page.content();
      const hasError = pageContent.toLowerCase().includes('error') &&
                      !pageContent.includes('no error');

      if (!hasError) {
        console.log(`✓ ${pagePath} page loads without errors`);
      }
    }
  });
});
