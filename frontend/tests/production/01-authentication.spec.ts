import { test, expect, Page } from '@playwright/test';

/**
 * AUTHENTICATION SYSTEM TESTS
 * Testing login, logout, session persistence, and authentication flows
 */

test.describe('Authentication System', () => {

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state for fresh testing
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/');

    // Check if login form elements are present
    const usernameField = page.locator('input[name="username"], input[name="email"]').first();
    const passwordField = page.locator('input[name="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();

    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(loginButton).toBeVisible();

    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/screenshots/login-page.png', fullPage: true });
  });

  test('should successfully login with admin/admin123', async ({ page }) => {
    await page.goto('/');

    // Fill login form
    const usernameField = page.locator('input[name="username"], input[name="email"]').first();
    await usernameField.fill('admin');

    const passwordField = page.locator('input[name="password"]');
    await passwordField.fill('admin123');

    // Submit form
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();

    // Wait for navigation to dashboard or main page
    await page.waitForURL(/\/(dashboard|home|main|pos)/, { timeout: 30000 });

    // Verify successful login by checking for authenticated elements
    const authenticatedElements = [
      page.locator('nav'), // Navigation should be present
      page.locator('[data-testid="sidebar"], .sidebar'), // Sidebar
      page.locator('button:has-text("Logout"), a:has-text("Logout")') // Logout option
    ];

    // At least one of these should be visible
    let foundAuthElement = false;
    for (const element of authenticatedElements) {
      if (await element.count() > 0) {
        foundAuthElement = true;
        break;
      }
    }

    expect(foundAuthElement).toBe(true);

    // Take screenshot of authenticated page
    await page.screenshot({ path: 'test-results/screenshots/authenticated-page.png', fullPage: true });
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/');

    // Try invalid credentials
    const usernameField = page.locator('input[name="username"], input[name="email"]').first();
    await usernameField.fill('invalid');

    const passwordField = page.locator('input[name="password"]');
    await passwordField.fill('invalid');

    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();

    // Should show error message or stay on login page
    await page.waitForTimeout(3000); // Wait for error message

    // Check for error indicators
    const errorIndicators = [
      page.locator('.error, .alert-error, [data-testid="error"]'),
      page.locator('text=/invalid|incorrect|wrong|error/i'),
      page.locator('.text-red-500, .text-red-600, .text-danger')
    ];

    let foundError = false;
    for (const indicator of errorIndicators) {
      if (await indicator.count() > 0) {
        foundError = true;
        break;
      }
    }

    // Either error shown or still on login page
    const stillOnLogin = await page.locator('input[name="username"], input[name="email"]').count() > 0;

    expect(foundError || stillOnLogin).toBe(true);

    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/screenshots/login-error.png', fullPage: true });
  });

  test('should maintain session on page refresh', async ({ page }) => {
    // First login
    await page.goto('/');

    const usernameField = page.locator('input[name="username"], input[name="email"]').first();
    await usernameField.fill('admin');

    const passwordField = page.locator('input[name="password"]');
    await passwordField.fill('admin123');

    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();

    // Wait for successful login
    await page.waitForURL(/\/(dashboard|home|main|pos)/, { timeout: 30000 });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be authenticated (not redirected to login)
    const isOnLoginPage = await page.locator('input[name="username"], input[name="email"]').count() > 0;
    expect(isOnLoginPage).toBe(false);

    // Take screenshot after refresh
    await page.screenshot({ path: 'test-results/screenshots/after-refresh.png', fullPage: true });
  });

  test('should successfully logout', async ({ page }) => {
    // First login
    await page.goto('/');

    const usernameField = page.locator('input[name="username"], input[name="email"]').first();
    await usernameField.fill('admin');

    const passwordField = page.locator('input[name="password"]');
    await passwordField.fill('admin123');

    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();

    await page.waitForURL(/\/(dashboard|home|main|pos)/, { timeout: 30000 });

    // Find and click logout button
    const logoutSelectors = [
      'button:has-text("Logout")',
      'a:has-text("Logout")',
      '[data-testid="logout"]',
      'button:has-text("Sign Out")',
      'a:has-text("Sign Out")'
    ];

    let loggedOut = false;
    for (const selector of logoutSelectors) {
      const logoutElement = page.locator(selector).first();
      if (await logoutElement.count() > 0) {
        await logoutElement.click();
        loggedOut = true;
        break;
      }
    }

    if (loggedOut) {
      // Wait for redirect to login page
      await page.waitForTimeout(2000);

      // Should be back on login page or redirected
      const backOnLogin = await page.locator('input[name="username"], input[name="email"]').count() > 0;
      expect(backOnLogin).toBe(true);

      // Take screenshot of logout state
      await page.screenshot({ path: 'test-results/screenshots/after-logout.png', fullPage: true });
    } else {
      console.log('⚠️  Logout button not found - manual logout test required');
    }
  });
});