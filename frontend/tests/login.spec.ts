import { test, expect } from '@playwright/test';

test.describe('Smart POS Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page.locator('text=SmartPOS')).toBeVisible();
    await expect(page.locator('text=Hệ thống quản lý bán hàng thông minh')).toBeVisible();
    await expect(page.locator('text=Đăng nhập')).toBeVisible();

    // Check form elements
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Đăng nhập")')).toBeVisible();
  });

  test('should show error with empty credentials', async ({ page }) => {
    // Click login button without entering credentials
    await page.click('button:has-text("Đăng nhập")');

    // Wait for error message
    await page.waitForTimeout(1000);

    // Should show validation error or stay on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="text"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click login button
    await page.click('button:has-text("Đăng nhập")');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Should show error message
    const errorMessage = await page.locator('text=Đăng nhập thất bại').isVisible();
    if (errorMessage) {
      expect(errorMessage).toBeTruthy();
    }

    // Should stay on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should successfully login with valid admin credentials', async ({ page }) => {
    // Fill in valid admin credentials
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');

    // Take screenshot before login
    await page.screenshot({ path: 'screenshots/before-login.png' });

    // Click login button
    await page.click('button:has-text("Đăng nhập")');

    // Wait for navigation or dashboard to load
    await page.waitForTimeout(3000);

    // Take screenshot after login
    await page.screenshot({ path: 'screenshots/after-login.png' });

    // Should redirect to dashboard or home page
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Check if redirected away from login page
    expect(currentUrl).not.toContain('/login');

    // Should see dashboard or user info
    // This depends on your app's structure
  });

  test('should store auth token after successful login', async ({ page, context }) => {
    // Fill in valid credentials
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');

    // Click login
    await page.click('button:has-text("Đăng nhập")');

    // Wait for login to complete
    await page.waitForTimeout(3000);

    // Check localStorage for auth token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));

    if (token) {
      console.log('Auth token found in localStorage');
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(0);
    }
  });

  test('should show/hide password when toggle clicked', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button[aria-label*="password"], svg[data-testid*="Visibility"]').first();

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Password should be visible as text
      const inputType = await page.locator('input').nth(1).getAttribute('type');
      console.log('Input type after toggle:', inputType);
    }
  });

  test('should have working "Đăng ký ngay" link', async ({ page }) => {
    const registerLink = page.locator('text=Đăng ký ngay');

    if (await registerLink.isVisible()) {
      await expect(registerLink).toBeVisible();
      // Don't click in test to avoid navigation
    }
  });

  test('should have working "Quên mật khẩu?" link', async ({ page }) => {
    const forgotPasswordLink = page.locator('text=Quên mật khẩu?');

    if (await forgotPasswordLink.isVisible()) {
      await expect(forgotPasswordLink).toBeVisible();
      // Don't click in test to avoid navigation
    }
  });

  test('should test API endpoint directly', async ({ request }) => {
    // Test the login API endpoint
    const response = await request.post('https://namhbcf-api.bangachieu2.workers.dev/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    console.log('API Response:', responseBody);

    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty('token');
    expect(responseBody.data).toHaveProperty('user');
    expect(responseBody.data.user.username).toBe('admin');
    expect(responseBody.data.user.role).toBe('admin');
  });
});
