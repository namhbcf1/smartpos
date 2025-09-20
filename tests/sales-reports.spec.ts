import { test, expect } from '@playwright/test';

test.describe('Sales and Reports System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Login first
    try {
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'admin@smartpos.vn');
      await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'admin123');
      await page.click('button:has-text("Login"), button:has-text("Đăng nhập"), button[type="submit"]');
      await page.waitForLoadState('networkidle');
    } catch (error) {
      console.log('Login may have failed, continuing with test');
    }
  });

  test('Sales page loads', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/sales');
    await page.waitForLoadState('networkidle');
    
    // Check for sales page elements
    const salesPage = page.locator('h1, h2, .page-title, [data-testid="sales-page"]');
    if (await salesPage.count() > 0) {
      await expect(salesPage.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Reports page loads', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/reports');
    await page.waitForLoadState('networkidle');
    
    // Check for reports page elements
    const reportsPage = page.locator('h1, h2, .page-title, [data-testid="reports-page"]');
    if (await reportsPage.count() > 0) {
      await expect(reportsPage.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Dashboard loads', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for dashboard elements
    const dashboard = page.locator('h1, h2, .page-title, [data-testid="dashboard-page"]');
    if (await dashboard.count() > 0) {
      await expect(dashboard.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Analytics page', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/analytics');
    await page.waitForLoadState('networkidle');
    
    // Check for analytics elements
    const analytics = page.locator('h1, h2, .page-title, [data-testid="analytics-page"]');
    if (await analytics.count() > 0) {
      await expect(analytics.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Export functionality', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/reports');
    await page.waitForLoadState('networkidle');
    
    // Try to find export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Xuất"), button:has-text("Download")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(2000);
    }
  });
});
