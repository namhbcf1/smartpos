import { test, expect } from '@playwright/test';

const API_BASE_URL = 'https://namhbcf-api.bangachieu2.workers.dev/api';
let authToken: string;

test.describe('Backend API Tests', () => {
  test('should authenticate and get token', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    authToken = data.token;
  });

  test('should get dashboard stats', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.products).toBeDefined();
    expect(data.data.customers).toBeDefined();
    expect(data.data.categories).toBeDefined();
    expect(data.data.sales).toBeDefined();
  });

  test('should get products list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/products?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.pagination).toBeDefined();
    console.log(`✓ Found ${data.products.length} products in database`);
  });

  test('should get customers list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/customers?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.customers)).toBe(true);
    expect(data.pagination).toBeDefined();
    console.log(`✓ Found ${data.customers.length} customers in database`);
  });

  test('should get categories list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/categories?page=1&limit=100`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.pagination).toBeDefined();
    console.log(`✓ Found ${data.categories.length} categories in database`);
  });

  test('should get sales list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/sales?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data.data)).toBe(true);
    console.log(`✓ Found ${data.data.data.length} sales in database`);
  });

  test('should get sales stats', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/sales/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(typeof data.data.total_sales).toBe('number');
    expect(typeof data.data.total_revenue).toBe('number');
    console.log(`✓ Sales stats: ${data.data.total_sales} sales, revenue: ${data.data.total_revenue}`);
  });

  test('should get orders list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/orders?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    console.log(`✓ Found ${data.data.length} orders in database`);
  });

  test('should get recent orders', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/orders/recent?status=all&limit=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    console.log(`✓ Found ${data.data.length} recent orders`);
  });

  test('should get top products', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/products/top?limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    console.log(`✓ Found ${data.data.length} top products`);
  });

  test('should search products', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/products?page=1&limit=20&search=Dell`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.products)).toBe(true);
    console.log(`✓ Search 'Dell' found ${data.products.length} products`);
  });

  test('should handle invalid authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/products`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('should get product categories', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/products/categories`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    console.log(`✓ Found ${data.data.length} product categories`);
  });
});
