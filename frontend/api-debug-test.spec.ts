import { test, expect } from '@playwright/test';

/**
 * 🔍 API Debug Test
 * Testing API responses in detail
 */

const APP_URL = 'https://23c8e94b.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev';

test.describe('🔍 API Debug Test', () => {
  
  test('🔍 Debug API Response', async ({ page }) => {
    console.log('🔍 Starting API debug test...');
    
    // Enable detailed network logging
    page.on('request', request => {
      console.log('🌐 Request:', request.method(), request.url());
      if (request.postData()) {
        console.log('📤 Request data:', request.postData());
      }
    });
    
    page.on('response', async response => {
      console.log('📡 Response:', response.status(), response.url());
      try {
        const responseText = await response.text();
        console.log('📄 Response body:', responseText.substring(0, 500));
      } catch (error) {
        console.log('❌ Could not read response body');
      }
    });
    
    // Go to login page
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // Click login and wait for response
    await page.click('button:has-text("Sign In")');
    
    // Wait for network activity
    await page.waitForTimeout(5000);
    
    // Check if we're still on login page
    const stillOnLogin = await page.locator('text=SmartPOS Login').count() > 0;
    console.log('Still on login page:', stillOnLogin);
    
    // Check for any error messages
    const errorMessages = page.locator('text=/error/i, text=/failed/i, text=/invalid/i');
    if (await errorMessages.count() > 0) {
      console.log('❌ Error messages found:');
      for (let i = 0; i < await errorMessages.count(); i++) {
        console.log(await errorMessages.nth(i).textContent());
      }
    }
    
    // Check for success messages
    const successMessages = page.locator('text=/success/i, text=/welcome/i');
    if (await successMessages.count() > 0) {
      console.log('✅ Success messages found:');
      for (let i = 0; i < await successMessages.count(); i++) {
        console.log(await successMessages.nth(i).textContent());
      }
    }
    
    console.log('🔍 API debug test completed');
  });

  test('🔍 Test API Directly', async ({ page }) => {
    console.log('🔍 Testing API directly...');
    
    // Test API health endpoint
    const healthResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/health');
        const data = await response.text();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Health API response:', healthResponse);
    
    // Test login API directly
    const loginResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'admin'
          })
        });
        const data = await response.text();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Login API response:', loginResponse);
    
    console.log('🔍 Direct API test completed');
  });
});
