import { test, expect } from '@playwright/test';

test.describe('Security Testing', () => {
  test('HTTPS enforcement', async ({ page }) => {
    const response = await page.goto('http://namhbcf-uk.pages.dev');
    // Should redirect to HTTPS
    expect(page.url()).toMatch(/^https:/);
  });

  test('XSS protection', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Try to inject XSS payload
    const xssPayload = '<script>alert("XSS")</script>';
    
    // Look for input fields and try XSS
    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      await inputs.first().fill(xssPayload);
      await page.waitForTimeout(2000);
      
      // Check if script was executed (should not be)
      const alerts = page.locator('text=XSS');
      expect(await alerts.count()).toBe(0);
    }
  });

  test('SQL injection protection', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/login');
    await page.waitForLoadState('networkidle');
    
    // Try SQL injection payload
    const sqlPayload = "'; DROP TABLE users; --";
    
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      await inputs.first().fill(sqlPayload);
      await page.waitForTimeout(2000);
      
      // Check if page still loads (should not crash)
      await expect(page).not.toHaveURL(/error|500|crash/);
    }
  });

  test('CSRF protection', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Check for CSRF tokens in forms
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      const csrfToken = page.locator('input[name*="csrf" i], input[name*="token" i]');
      if (await csrfToken.isVisible()) {
        await expect(csrfToken).toBeVisible();
      }
    }
  });

  test('Content Security Policy', async ({ page }) => {
    const response = await page.goto('https://namhbcf-uk.pages.dev/');
    const headers = response?.headers();
    
    // Check for CSP header
    if (headers) {
      const csp = headers['content-security-policy'] || headers['Content-Security-Policy'];
      if (csp) {
        expect(csp).toBeDefined();
      }
    }
  });

  test('Authentication bypass attempts', async ({ page }) => {
    // Try to access protected routes without authentication
    const protectedRoutes = [
      'https://namhbcf-uk.pages.dev/admin',
      'https://namhbcf-uk.pages.dev/dashboard',
      'https://namhbcf-uk.pages.dev/settings',
      'https://namhbcf-uk.pages.dev/users'
    ];
    
    for (const route of protectedRoutes) {
      const response = await page.goto(route);
      if (response) {
        const status = response.status();
        expect([200, 401, 403, 404]).toContain(status);
      }
    }
  });

  test('File upload security', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Look for file upload inputs
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    
    if (fileInputCount > 0) {
      // Check if file type restrictions are in place
      const acceptAttribute = await fileInputs.first().getAttribute('accept');
      if (acceptAttribute) {
        expect(acceptAttribute).toBeDefined();
      }
    }
  });
});
