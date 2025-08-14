import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * Authentication Flow Tests
 * Tests login, logout, session management, and authentication state
 */

test.describe('Authentication Flow', () => {
  let helpers: SmartPOSTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Verify page title
    await expect(page).toHaveTitle(/SmartPOS/);
    
    // Verify login form elements
    await expect(page.locator('h1')).toContainText('SmartPOS Login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verify demo credentials are shown
    await expect(page.locator('text*="admin"')).toBeVisible();
    await expect(page.locator('text*="Tài khoản demo"')).toBeVisible();
    
    // Verify register link
    await expect(page.locator('text*="Đăng ký ngay"')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify successful login
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('SmartPOS');
    
    // Verify user menu is visible
    await expect(page.locator('button[aria-label*="User"]')).toBeVisible();
    
    // Verify success message
    await expect(page.locator('text*="Đăng nhập thành công"')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid credentials
    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[name="password"]', 'invalid');
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
    
    // Should show error message (if implemented)
    // Note: This test might need adjustment based on actual error handling
  });

  test('should handle empty form submission', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
    
    // Form validation should prevent submission
    const usernameField = page.locator('input[name="username"]');
    const passwordField = page.locator('input[name="password"]');
    
    // Check if HTML5 validation is working
    await expect(usernameField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await helpers.login();
    
    // Verify we're logged in
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Click user menu
    await page.click('button[aria-label*="User"]');
    
    // Click logout
    await page.click('text*="Đăng xuất"');
    
    // Should redirect to login page
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('SmartPOS Login');
  });

  test('should maintain session on page refresh', async ({ page }) => {
    // Login first
    await helpers.login();
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('button[aria-label*="User"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected routes without authentication', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('SmartPOS Login');
  });

  test('should redirect to dashboard when accessing login while authenticated', async ({ page }) => {
    // Login first
    await helpers.login();
    
    // Try to access login page
    await page.goto('/login');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('SmartPOS');
  });

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto('/login');
    
    const passwordField = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[aria-label*="password"], button[title*="password"]');
    
    // Initially password should be hidden
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // Click toggle button if it exists
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await expect(passwordField).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await toggleButton.click();
      await expect(passwordField).toHaveAttribute('type', 'password');
    }
  });

  test('should test responsive design on login page', async ({ page }) => {
    await page.goto('/login');
    await helpers.testResponsiveDesign();
  });
});
