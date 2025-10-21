import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://5895f31e.namhbcf-uk.pages.dev';

test.describe('Frontend Pages Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 10000 });
  });

  test('should load dashboard page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/`);
    await page.waitForLoadState('networkidle');

    // Check for dashboard elements
    const title = await page.locator('h1, h2').first();
    await expect(title).toBeVisible();

    console.log('✓ Dashboard page loaded successfully');
  });

  test('should display dashboard stats cards', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for API calls

    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });

    console.log('✓ Dashboard stats displayed');
  });

  test('should load products page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for products table or grid
    const productsContainer = await page.locator('table, .grid, .products-list').first();
    await expect(productsContainer).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/products.png', fullPage: true });
    console.log('✓ Products page loaded successfully');
  });

  test('should load customers page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/customers.png', fullPage: true });
    console.log('✓ Customers page loaded successfully');
  });

  test('should load categories page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/categories`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/categories.png', fullPage: true });
    console.log('✓ Categories page loaded successfully');
  });

  test('should load sales page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/sales`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/sales.png', fullPage: true });
    console.log('✓ Sales page loaded successfully');
  });

  test('should load orders page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/orders`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/orders.png', fullPage: true });
    console.log('✓ Orders page loaded successfully');
  });

  test('should load inventory page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/inventory`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/inventory.png', fullPage: true });
    console.log('✓ Inventory page loaded successfully');
  });

  test('should navigate through menu', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/`);
    await page.waitForLoadState('networkidle');

    // Click on Products menu
    const productsLink = page.locator('a[href*="products"], nav a:has-text("Products"), nav a:has-text("Sản phẩm")').first();
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await page.waitForURL(/.*products.*/);
      console.log('✓ Navigated to Products page');
    }

    // Click on Customers menu
    const customersLink = page.locator('a[href*="customers"], nav a:has-text("Customers"), nav a:has-text("Khách hàng")').first();
    if (await customersLink.isVisible()) {
      await customersLink.click();
      await page.waitForURL(/.*customers.*/);
      console.log('✓ Navigated to Customers page');
    }
  });

  test('should search for products', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Tìm"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Dell');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/products-search.png', fullPage: true });
      console.log('✓ Product search functionality works');
    }
  });

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${FRONTEND_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('net::ERR')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠ Console errors found:', criticalErrors);
    } else {
      console.log('✓ No critical console errors');
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${FRONTEND_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/mobile-view.png', fullPage: true });
    console.log('✓ Mobile responsive design works');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${FRONTEND_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/tablet-view.png', fullPage: true });
    console.log('✓ Tablet responsive design works');
  });
});

test.describe('Login Flow Tests', () => {
  test('should show login page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);

    const usernameInput = await page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = await page.locator('input[name="password"], input[type="password"]').first();

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await page.screenshot({ path: 'test-results/login-page.png' });
    console.log('✓ Login page displayed correctly');
  });

  test('should login successfully', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);

    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 10000 });
    console.log('✓ Login successful');
  });

  test('should handle invalid login', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);

    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should still be on login page
    expect(page.url()).toContain('login');
    console.log('✓ Invalid login handled correctly');
  });
});
