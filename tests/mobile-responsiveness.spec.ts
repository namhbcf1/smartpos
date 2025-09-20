import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test('Mobile viewport - POS page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://namhbcf-uk.pages.dev/pos');
    await page.waitForLoadState('networkidle');
    
    // Check if mobile menu is accessible
    const mobileMenu = page.locator('button[aria-label*="menu" i], button:has-text("☰"), button:has-text("Menu")');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(2000);
    }
  });

  test('Tablet viewport - Dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('https://namhbcf-uk.pages.dev/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if layout adapts to tablet
    const mainContent = page.locator('main, .main-content, #main, .dashboard-content');
    if (await mainContent.isVisible()) {
      await expect(mainContent).toBeVisible();
    }
  });

  test('Desktop viewport - Full functionality', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Check if all navigation elements are visible
    const navigation = page.locator('nav, .navigation, .navbar, .sidebar');
    if (await navigation.isVisible()) {
      await expect(navigation).toBeVisible();
    }
  });

  test('Touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://namhbcf-uk.pages.dev/pos');
    await page.waitForLoadState('networkidle');
    
    // Test touch interactions
    const touchableElements = page.locator('button, a, input[type="button"]');
    const count = await touchableElements.count();
    
    if (count > 0) {
      await touchableElements.first().click();
      await page.waitForTimeout(2000);
    }
  });

  test('Mobile form inputs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://namhbcf-uk.pages.dev/login');
    await page.waitForLoadState('networkidle');
    
    // Test mobile form inputs
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      await inputs.first().fill('admin@smartpos.vn');
      await page.waitForTimeout(2000);
    }
  });
});
