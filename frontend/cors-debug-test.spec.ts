import { test, expect } from '@playwright/test';

/**
 * 🔍 CORS Debug Test
 * Testing CORS and API communication
 */

const APP_URL = 'https://23c8e94b.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev';

test.describe('🔍 CORS Debug Test', () => {
  
  test('🔍 Test CORS and API Communication', async ({ page }) => {
    console.log('🔍 Starting CORS debug test...');
    
    // Enable detailed network logging
    page.on('request', request => {
      console.log('🌐 Request:', request.method(), request.url());
      console.log('📤 Request headers:', request.headers());
      if (request.postData()) {
        console.log('📤 Request data:', request.postData());
      }
    });
    
    page.on('response', async response => {
      console.log('📡 Response:', response.status(), response.url());
      console.log('📥 Response headers:', response.headers());
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
    
    // Check for any error messages in console
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('📝 Console:', msg.text());
    });
    
    // Wait a bit more to capture console logs
    await page.waitForTimeout(2000);
    
    console.log('🔍 CORS debug test completed');
  });

  test('🔍 Test API with Different Origins', async ({ page }) => {
    console.log('🔍 Testing API with different origins...');
    
    // Test API from different origin
    const testResults = await page.evaluate(async () => {
      const results = [];
      
      // Test 1: Direct fetch from same origin
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/health');
        results.push({
          test: 'Direct fetch from same origin',
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (error) {
        results.push({
          test: 'Direct fetch from same origin',
          error: error.message
        });
      }
      
      // Test 2: Fetch with credentials
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/health', {
          credentials: 'include'
        });
        results.push({
          test: 'Fetch with credentials',
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (error) {
        results.push({
          test: 'Fetch with credentials',
          error: error.message
        });
      }
      
      // Test 3: Login API with credentials
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: 'admin',
            password: 'admin'
          })
        });
        const data = await response.text();
        results.push({
          test: 'Login API with credentials',
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: data.substring(0, 200)
        });
      } catch (error) {
        results.push({
          test: 'Login API with credentials',
          error: error.message
        });
      }
      
      return results;
    });
    
    console.log('API test results:', testResults);
    
    console.log('🔍 API origin test completed');
  });
});
