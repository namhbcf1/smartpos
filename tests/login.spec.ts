import { test, expect } from '@playwright/test';

const BASE_URL = 'https://d3d1a12e.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('SmartPOS Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SmartPOS/);
    
    // Check login form elements
    await expect(page.locator('text=SmartPOS Login')).toBeVisible();
    await expect(page.locator('text=Enter your credentials to access the system')).toBeVisible();
    
    // Check input fields
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Check login button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Check default login hint
    await expect(page.locator('text=Default login: admin / admin')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Wait for validation errors
    await page.waitForTimeout(1000);
    
    // Check for validation messages (if any)
    const errorMessages = page.locator('.MuiFormHelperText-root');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[name="password"]', 'invalid');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error response
    await page.waitForTimeout(2000);
    
    // Check for error message
    const errorMessage = page.locator('text=Tài khoản hoặc mật khẩu không đúng');
    await expect(errorMessage).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL('**/', { timeout: 10000 });
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*\/$/);
    
    // Check for dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/v1/auth/login', route => {
      route.abort('failed');
    });
    
    // Fill in credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Check for error message
    const errorMessage = page.locator('text=Network error');
    await expect(errorMessage).toBeVisible();
  });

  test('should test password visibility toggle', async ({ page }) => {
    // Fill password
    await page.fill('input[name="password"]', 'testpassword');
    
    // Check password is masked by default
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
    
    // Click password visibility toggle
    await page.click('button[aria-label="toggle password visibility"]');
    
    // Check password is now visible
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
    
    // Toggle back
    await page.click('button[aria-label="toggle password visibility"]');
    
    // Check password is masked again
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
  });

  test('should test API endpoint directly', async ({ request }) => {
    // Test API endpoint
    const response = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123456'
      },
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL
      }
    });
    
    // Check response
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.data.username).toBe('admin');
  });

  test('should test CORS preflight request', async ({ request }) => {
    // Test OPTIONS request
    const response = await request.options(`${API_URL}/api/v1/auth/login`, {
      headers: {
        'Origin': BASE_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    // Check CORS headers
    expect(response.status()).toBe(204);
    expect(response.headers()['access-control-allow-origin']).toBe(BASE_URL);
    expect(response.headers()['access-control-allow-credentials']).toBe('true');
  });

  test('should test logout functionality', async ({ page }) => {
    // First login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Find and click logout button (adjust selector based on your UI)
    const logoutButton = page.locator('button:has-text("Logout"), [data-testid="logout"], .logout-button');
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Should redirect to login page
      await page.waitForURL('**/login');
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should test session persistence', async ({ page, context }) => {
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Navigate to another page
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in
    await expect(page).not.toHaveURL(/.*login/);
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('should test responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check login form is still accessible
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check login form is still accessible
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
}); 