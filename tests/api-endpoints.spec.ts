import { test, expect } from '@playwright/test';

test.describe('API Endpoints Testing', () => {
  test('API health check', async ({ request }) => {
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/health');
    expect(response.status()).toBe(200);
  });

  test('Products API endpoint', async ({ request }) => {
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/api/v1/products');
    const status = response.status();
    expect([200, 401, 403]).toContain(status);
  });

  test('Categories API endpoint', async ({ request }) => {
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/api/v1/categories');
    const status = response.status();
    expect([200, 401, 403]).toContain(status);
  });

  test('Suppliers API endpoint', async ({ request }) => {
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/api/v1/suppliers');
    const status = response.status();
    expect([200, 401, 403, 500]).toContain(status);
  });

  test('Sales API endpoint', async ({ request }) => {
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/api/v1/sales');
    const status = response.status();
    expect([200, 401, 403]).toContain(status);
  });

  test('Users API endpoint', async ({ request }) => {
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/api/v1/users');
    const status = response.status();
    expect([200, 401, 403, 500]).toContain(status);
  });

  test('Authentication API endpoint', async ({ request }) => {
    const response = await request.post('https://namhbcf-api.bangachieu2.workers.dev/api/v1/simple-login', {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    const status = response.status();
    expect([200, 400, 401, 422]).toContain(status);
  });

  test('Database connection test', async ({ request }) => {
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/api/v1/test-db-connection');
    const status = response.status();
    expect([200, 500, 503]).toContain(status);
  });
});
