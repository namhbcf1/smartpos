import { test, expect } from '@playwright/test';

test.describe('Quick Smart POS Tests (No Browser)', () => {
  const API_BASE = 'https://namhbcf-api.bangachieu2.workers.dev';

  test('1. API Health Check', async ({ request }) => {
    test.setTimeout(60000); // Increase timeout to 60s

    const response = await request.get(`${API_BASE}/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    console.log('✅ Health Check:', body.status);
    expect(body.status).toBe('healthy');
  });

  test('2. Admin Login Test', async ({ request }) => {
    test.setTimeout(60000); // Increase timeout to 60s

    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    console.log('✅ Login Success');
    console.log('   Username:', body.data?.user?.username);
    console.log('   Role:', body.data?.user?.role);
    console.log('   Token length:', body.data?.token?.length);

    expect(body.success).toBe(true);
    expect(body.data.user.username).toBe('admin');
  });

  test('3. Invalid Login Test', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: 'wrong', password: 'wrong' }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();

    console.log('✅ Invalid login correctly rejected');
    expect(body.success).toBe(false);
  });

  test('4. API Info Endpoint', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/info`);

    if (response.ok()) {
      const body = await response.json();
      console.log('✅ API Info:');
      console.log('   Version:', body.version);
      console.log('   Features:', Object.keys(body.features || {}).join(', '));
    }
  });

  test('5. Frontend Deployment Check', async ({ request }) => {
    const response = await request.get('https://53138c58.namhbcf-uk.pages.dev');

    expect(response.ok()).toBeTruthy();
    console.log('✅ Frontend is online');
    console.log('   Status:', response.status());
  });
});

test.describe('Performance Tests', () => {
  const API_BASE = 'https://namhbcf-api.bangachieu2.workers.dev';

  test('Login API Response Time', async ({ request }) => {
    const start = Date.now();

    await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    });

    const duration = Date.now() - start;
    console.log(`⏱️  Login took ${duration}ms`);

    expect(duration).toBeLessThan(5000); // Should be under 5 seconds
  });

  test('Health Check Response Time', async ({ request }) => {
    const start = Date.now();
    await request.get(`${API_BASE}/health`);
    const duration = Date.now() - start;

    console.log(`⏱️  Health check took ${duration}ms`);
    expect(duration).toBeLessThan(3000);
  });
});
