import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.E2E_API_URL || 'http://localhost:8787';

// Test data
const TEST_USER = {
  username: 'admin',
  password: 'admin123',
  fullName: 'Administrator'
};

// Page object model for login page
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/login`);
  }

  async fillCredentials(username: string, password: string) {
    await this.page.fill('[data-testid="username-input"]', username);
    await this.page.fill('[data-testid="password-input"]', password);
  }

  async clickLogin() {
    await this.page.click('[data-testid="login-button"]');
  }

  async getErrorMessage() {
    return await this.page.textContent('[data-testid="error-message"]');
  }

  async isLoginFormVisible() {
    return await this.page.isVisible('[data-testid="login-form"]');
  }
}

// Page object model for dashboard
class DashboardPage {
  constructor(private page: Page) {}

  async isVisible() {
    return await this.page.isVisible('[data-testid="dashboard"]');
  }

  async getUserName() {
    return await this.page.textContent('[data-testid="user-name"]');
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
  }

  async navigateToProducts() {
    await this.page.click('[data-testid="products-nav"]');
  }

  async navigateToSales() {
    await this.page.click('[data-testid="sales-nav"]');
  }
}

test.describe('Authentication E2E Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Login Flow', () => {
    test('should display login form', async ({ page }) => {
      await loginPage.goto();
      
      expect(await loginPage.isLoginFormVisible()).toBe(true);
      expect(await page.title()).toContain('SmartPOS');
    });

    test('should login with valid credentials', async ({ page }) => {
      await loginPage.goto();
      await loginPage.fillCredentials(TEST_USER.username, TEST_USER.password);
      await loginPage.clickLogin();

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard');
      expect(await dashboardPage.isVisible()).toBe(true);
      
      // Should display user name
      const userName = await dashboardPage.getUserName();
      expect(userName).toContain(TEST_USER.fullName);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await loginPage.goto();
      await loginPage.fillCredentials('invalid', 'credentials');
      await loginPage.clickLogin();

      // Should show error message
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain('Invalid credentials');
      
      // Should stay on login page
      expect(await loginPage.isLoginFormVisible()).toBe(true);
    });

    test('should validate required fields', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickLogin();

      // Should show validation errors
      const usernameError = await page.textContent('[data-testid="username-error"]');
      const passwordError = await page.textContent('[data-testid="password-error"]');
      
      expect(usernameError).toContain('required');
      expect(passwordError).toContain('required');
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route(`${API_URL}/api/v1/auth/login`, route => {
        route.abort('failed');
      });

      await loginPage.goto();
      await loginPage.fillCredentials(TEST_USER.username, TEST_USER.password);
      await loginPage.clickLogin();

      // Should show network error
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain('network');
    });
  });

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await loginPage.goto();
      await loginPage.fillCredentials(TEST_USER.username, TEST_USER.password);
      await loginPage.clickLogin();
      await page.waitForURL('**/dashboard');
    });

    test('should logout successfully', async ({ page }) => {
      await dashboardPage.logout();
      
      // Should redirect to login page
      await page.waitForURL('**/login');
      expect(await loginPage.isLoginFormVisible()).toBe(true);
    });

    test('should clear session data on logout', async ({ page }) => {
      await dashboardPage.logout();
      
      // Try to access protected route directly
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should redirect to login
      await page.waitForURL('**/login');
      expect(await loginPage.isLoginFormVisible()).toBe(true);
    });
  });

  test.describe('Session Management', () => {
    test('should persist session on page refresh', async ({ page }) => {
      await loginPage.goto();
      await loginPage.fillCredentials(TEST_USER.username, TEST_USER.password);
      await loginPage.clickLogin();
      await page.waitForURL('**/dashboard');

      // Refresh page
      await page.reload();
      
      // Should still be logged in
      expect(await dashboardPage.isVisible()).toBe(true);
    });

    test('should redirect to login when session expires', async ({ page }) => {
      await loginPage.goto();
      await loginPage.fillCredentials(TEST_USER.username, TEST_USER.password);
      await loginPage.clickLogin();
      await page.waitForURL('**/dashboard');

      // Mock expired token response
      await page.route(`${API_URL}/api/v1/**`, route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'TOKEN_EXPIRED'
          })
        });
      });

      // Try to navigate to another page
      await dashboardPage.navigateToProducts();
      
      // Should redirect to login
      await page.waitForURL('**/login');
      expect(await loginPage.isLoginFormVisible()).toBe(true);
    });
  });

  test.describe('Security', () => {
    test('should prevent access to protected routes without authentication', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/products',
        '/sales',
        '/customers',
        '/reports'
      ];

      for (const route of protectedRoutes) {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForURL('**/login');
        expect(await loginPage.isLoginFormVisible()).toBe(true);
      }
    });

    test('should handle XSS attempts in login form', async ({ page }) => {
      await loginPage.goto();
      
      const xssPayload = '<script>alert("xss")</script>';
      await loginPage.fillCredentials(xssPayload, xssPayload);
      await loginPage.clickLogin();

      // Should not execute script
      const alerts = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });

      expect(alerts).toHaveLength(0);
    });

    test('should include security headers', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/login`);
      
      // Check for security headers
      const headers = response?.headers();
      expect(headers?.['x-content-type-options']).toBe('nosniff');
      expect(headers?.['x-frame-options']).toBe('DENY');
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible with keyboard navigation', async ({ page }) => {
      await loginPage.goto();
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('username-input');
      
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('password-input');
      
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('login-button');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await loginPage.goto();
      
      const usernameInput = page.locator('[data-testid="username-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      
      expect(await usernameInput.getAttribute('aria-label')).toBeTruthy();
      expect(await passwordInput.getAttribute('aria-label')).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load login page quickly', async ({ page }) => {
      const startTime = Date.now();
      await loginPage.goto();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });

      await loginPage.goto();
      await loginPage.fillCredentials(TEST_USER.username, TEST_USER.password);
      await loginPage.clickLogin();

      // Should still work, just slower
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      expect(await dashboardPage.isVisible()).toBe(true);
    });
  });
});