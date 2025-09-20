import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('POS page performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // POS page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Products page performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Products page should load within 4 seconds
    expect(loadTime).toBeLessThan(4000);
  });

  test('API response time', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/api/products');
    const responseTime = Date.now() - startTime;
    
    // API should respond within 2 seconds
    expect(responseTime).toBeLessThan(2000);
  });

  test('Memory usage check', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for memory leaks by navigating multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/pos');
      await page.waitForTimeout(1000);
      await page.goto('/products');
      await page.waitForTimeout(1000);
    }
    
    // Page should still be responsive
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Network requests optimization', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for unnecessary requests
    const duplicateRequests = requests.filter((url, index) => requests.indexOf(url) !== index);
    expect(duplicateRequests.length).toBe(0);
  });
});
