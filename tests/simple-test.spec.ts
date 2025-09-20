import { test, expect } from '@playwright/test';

test.describe('Simple Website Tests', () => {
  test('Website loads successfully', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Check if page title exists
    const title = await page.title();
    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });

  test('POS page loads', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/pos');
    await page.waitForLoadState('networkidle');
    
    // Check if any content is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('API endpoints respond', async ({ request }) => {
    const response = await request.get('https://namhbcf-api.bangachieu2.workers.dev/api/v1/products');
    const status = response.status();
    expect([200, 401, 403]).toContain(status);
  });
});
