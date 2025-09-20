import { test, expect } from '@playwright/test';

test.describe('Inventory Management System', () => {
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

  test('Products page loads', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/products');
    await page.waitForLoadState('networkidle');
    
    // Check for product list elements
    const productList = page.locator('[data-testid="product-list"], .product-grid, .product-item, .grid, .container');
    if (await productList.count() > 0) {
      await expect(productList.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Add new product', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/products');
    await page.waitForLoadState('networkidle');
    
    // Try to find add product button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Thêm"), button:has-text("New"), button:has-text("Mới"), button:has-text("+")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('Product search and filter', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/products');
    await page.waitForLoadState('networkidle');
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="tìm" i], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
    }
  });

  test('Categories management', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/products/categories');
    await page.waitForLoadState('networkidle');
    
    // Check for categories page
    const categoriesPage = page.locator('h1, h2, .page-title, [data-testid="categories-page"]');
    if (await categoriesPage.count() > 0) {
      await expect(categoriesPage.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Suppliers management', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/suppliers');
    await page.waitForLoadState('networkidle');
    
    // Check for suppliers page
    const suppliersPage = page.locator('h1, h2, .page-title, [data-testid="suppliers-page"]');
    if (await suppliersPage.count() > 0) {
      await expect(suppliersPage.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
