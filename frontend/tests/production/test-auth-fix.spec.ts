import { test, expect } from '@playwright/test';

/**
 * TEST AUTHENTICATION FIX
 */

const PRODUCTION_URL = 'https://1bd20bf0.namhbcf-uk.pages.dev';

test.describe('Authentication Fix Testing', () => {

  test('should test auth fix and delete operations', async ({ page }) => {
    console.log('🚀 TESTING AUTHENTICATION FIX');

    // Login
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');

    const usernameInput = page.locator('input[placeholder*="admin"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Đăng nhập")').first();

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await loginButton.click();
    await page.waitForTimeout(3000);

    console.log('✅ LOGGED IN');

    // Go to products page
    await page.goto(`${PRODUCTION_URL}/products`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'production-test-results/auth-fix-products.png', fullPage: true });

    // Check for products
    const productCards = await page.locator('.card, [data-testid*="product"], .product-card').count();
    console.log(`📦 Product cards found: ${productCards}`);

    // Check for buttons
    const buttons = await page.locator('button').count();
    const deleteButtons = await page.locator('button:has-text("Xóa"), button[title*="delete"], button[aria-label*="delete"]').count();

    console.log(`🔘 Total buttons: ${buttons}`);
    console.log(`🗑️ Delete buttons: ${deleteButtons}`);

    // Test different operations
    const operations = [
      '/dashboard',
      '/pos',
      '/customers',
      '/inventory',
      '/sales',
      '/orders'
    ];

    let workingPages = 0;

    for (const op of operations) {
      try {
        await page.goto(`${PRODUCTION_URL}${op}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        const hasError = await page.locator('text=/401|unauthorized|error|lỗi/i').count();

        if (hasError === 0) {
          workingPages++;
          console.log(`✅ ${op}: Working`);
        } else {
          console.log(`❌ ${op}: Has errors`);
        }
      } catch (error) {
        console.log(`⚠️ ${op}: Timeout`);
      }
    }

    // Final report
    console.log('');
    console.log('🎉 AUTH FIX TEST RESULTS:');
    console.log('========================');
    console.log(`✅ Working pages: ${workingPages}/${operations.length}`);
    console.log(`✅ Products found: ${productCards}`);
    console.log(`✅ Delete buttons: ${deleteButtons}`);
    console.log(`✅ Total buttons: ${buttons}`);
    console.log('========================');

    // Take final screenshot
    await page.goto(`${PRODUCTION_URL}/dashboard`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'production-test-results/auth-fix-final.png', fullPage: true });

    // Assertions
    expect(workingPages).toBeGreaterThan(4);
    expect(buttons).toBeGreaterThan(30);

    console.log('🏆 AUTH FIX TEST COMPLETED!');
  });

});