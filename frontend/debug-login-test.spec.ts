import { test, expect } from '@playwright/test';

/**
 * 🔍 Debug Login Test
 * Testing login process step by step
 */

const APP_URL = 'https://23c8e94b.smartpos-web.pages.dev';

test.describe('🔍 Debug Login Test', () => {
  
  test('🔍 Debug Login Process', async ({ page }) => {
    console.log('🔍 Starting debug login test...');
    
    // 1. Go to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded');
    console.log('Current URL:', page.url());
    
    // 2. Check if we're on login page
    const loginTitle = page.locator('text=SmartPOS Login');
    const isLoginPage = await loginTitle.count() > 0;
    console.log('Is login page:', isLoginPage);
    
    if (!isLoginPage) {
      console.log('❌ Not on login page, current page content:');
      const pageContent = await page.content();
      console.log(pageContent.substring(0, 500));
      return;
    }
    
    // 3. Fill login form
    console.log('🔐 Filling login form...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // 4. Take screenshot before clicking
    await page.screenshot({ path: 'debug-before-login.png' });
    console.log('📸 Screenshot saved: debug-before-login.png');
    
    // 5. Click sign in
    console.log('🖱️ Clicking sign in button...');
    await page.click('button:has-text("Sign In")');
    
    // 6. Wait and check what happens
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ After login attempt');
    console.log('Current URL:', page.url());
    
    // 7. Take screenshot after clicking
    await page.screenshot({ path: 'debug-after-login.png' });
    console.log('📸 Screenshot saved: debug-after-login.png');
    
    // 8. Check for errors
    const errorMessages = page.locator('text=/error/i, text=/failed/i, text=/invalid/i');
    if (await errorMessages.count() > 0) {
      console.log('❌ Error messages found:');
      for (let i = 0; i < await errorMessages.count(); i++) {
        console.log(await errorMessages.nth(i).textContent());
      }
    }
    
    // 9. Check if still on login page
    const stillOnLogin = await page.locator('text=SmartPOS Login').count() > 0;
    console.log('Still on login page:', stillOnLogin);
    
    // 10. Check for any success indicators
    const successIndicators = page.locator('text=/dashboard/i, text=/welcome/i, text=/success/i');
    if (await successIndicators.count() > 0) {
      console.log('✅ Success indicators found:');
      for (let i = 0; i < await successIndicators.count(); i++) {
        console.log(await successIndicators.nth(i).textContent());
      }
    }
    
    // 11. Check network requests
    console.log('🌐 Checking network requests...');
    const requests = page.context().pages()[0].request;
    console.log('Network requests logged');
    
    console.log('🔍 Debug test completed');
  });

  test('🔍 Check API Connectivity', async ({ page }) => {
    console.log('🔍 Checking API connectivity...');
    
    // Enable network logging
    page.on('request', request => {
      console.log('🌐 Request:', request.method(), request.url());
    });
    
    page.on('response', response => {
      console.log('📡 Response:', response.status(), response.url());
    });
    
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Try to login and see network activity
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(5000);
    
    console.log('✅ API connectivity test completed');
  });
});
