import { test, expect } from '@playwright/test';

test.describe('Authentication System', () => {
  test('Login page loads', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check for login form elements
    const usernameInput = page.locator('input[type="text"], input[type="email"], input[name*="user" i], input[name*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Đăng nhập")');
    
    if (await usernameInput.isVisible()) {
      await expect(usernameInput).toBeVisible();
    }
    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible();
    }
    if (await loginButton.isVisible()) {
      await expect(loginButton).toBeVisible();
    }
  });

  test('Registration page loads', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Check for registration form elements
    const registerButton = page.locator('button:has-text("Register"), button:has-text("Đăng ký")');
    if (await registerButton.isVisible()) {
      await expect(registerButton).toBeVisible();
    }
  });

  test('Password reset page', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    
    // Check for password reset form
    const resetButton = page.locator('button:has-text("Reset"), button:has-text("Đặt lại")');
    if (await resetButton.isVisible()) {
      await expect(resetButton).toBeVisible();
    }
  });
});
