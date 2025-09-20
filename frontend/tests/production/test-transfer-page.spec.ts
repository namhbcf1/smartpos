import { test, expect } from '@playwright/test';

/**
 * TEST TRANSFER PAGE SPECIFICALLY
 */

const PRODUCTION_URL = 'https://28316805.namhbcf-uk.pages.dev';

test.describe('Transfer Page Testing', () => {

  test('should test transfer page functionality', async ({ page }) => {
    console.log('🚀 TESTING TRANSFER PAGE');

    // Login first
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('input[placeholder*="admin"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Đăng nhập")').first();

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await loginButton.click();
    await page.waitForTimeout(3000);

    console.log('✅ LOGGED IN SUCCESSFULLY');

    // Navigate to transfer page
    await page.goto(`${PRODUCTION_URL}/inventory/transfer`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'production-test-results/transfer-page-fixed.png', fullPage: true });

    // Check if page loaded without errors
    const hasError = await page.locator('text=/404|not found|error|lỗi/i').count() === 0;
    const pageTitle = await page.locator('h4, h1').first().textContent();

    console.log(`📄 Page Title: ${pageTitle}`);
    console.log(`❌ Has Errors: ${!hasError}`);

    // Count interactive elements
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input').count();
    const selects = await page.locator('select, [role="combobox"]').count();

    console.log(`🔘 Buttons: ${buttons}`);
    console.log(`📝 Inputs: ${inputs}`);
    console.log(`📋 Selects: ${selects}`);

    // Check for transfer-specific elements
    const productSearchExists = await page.locator('input[placeholder*="sản phẩm"], input[label*="sản phẩm"]').count() > 0;
    const storeSelectExists = await page.locator('text=/chi nhánh/i').count() > 0;
    const quantityInputExists = await page.locator('input[type="number"]').count() > 0;

    console.log(`🔍 Product Search: ${productSearchExists ? 'Found' : 'Not Found'}`);
    console.log(`🏪 Store Selection: ${storeSelectExists ? 'Found' : 'Not Found'}`);
    console.log(`🔢 Quantity Input: ${quantityInputExists ? 'Found' : 'Not Found'}`);

    // Final assertions
    expect(hasError).toBe(true); // No errors
    expect(buttons).toBeGreaterThan(5); // Should have multiple buttons
    expect(inputs).toBeGreaterThan(2); // Should have input fields
    expect(productSearchExists).toBe(true); // Should have product search
    expect(storeSelectExists).toBe(true); // Should have store selection

    console.log('✅ TRANSFER PAGE TEST PASSED!');
  });

});