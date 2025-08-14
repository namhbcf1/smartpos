import { test, expect } from '@playwright/test';

const BASE_URL = 'https://fc9f4436.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Debug Cookie Issues', () => {
  test('should debug cookie setting in detail', async ({ page }) => {
    // Enable detailed logging
    page.on('response', async response => {
      if (response.url().includes('/auth/login')) {
        console.log('\n=== LOGIN RESPONSE DETAILS ===');
        console.log('Status:', response.status());
        console.log('Headers:', await response.allHeaders());
        
        // Check Set-Cookie header specifically
        const headers = await response.allHeaders();
        const setCookie = headers['set-cookie'];
        console.log('Set-Cookie header:', setCookie);
        
        // Get response body
        try {
          const body = await response.json();
          console.log('Response body:', body);
        } catch (e) {
          console.log('Could not parse response body as JSON');
        }
      }
    });

    console.log('\n=== STEP 1: Navigate to login ===');
    await page.goto(`${BASE_URL}/login`);
    
    console.log('\n=== STEP 2: Check initial cookies ===');
    const initialCookies = await page.context().cookies();
    console.log('Initial cookies:', initialCookies);

    console.log('\n=== STEP 3: Perform login ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    // Wait for login response
    await page.waitForTimeout(3000);
    
    console.log('\n=== STEP 4: Check cookies after login ===');
    const afterLoginCookies = await page.context().cookies();
    console.log('Cookies after login:', afterLoginCookies);
    
    // Check cookies for specific domains
    const allCookies = await page.context().cookies();
    console.log('All cookies (all domains):', allCookies);
    
    const apiCookies = await page.context().cookies(API_URL);
    console.log('API domain cookies:', apiCookies);
    
    const frontendCookies = await page.context().cookies(BASE_URL);
    console.log('Frontend domain cookies:', frontendCookies);

    console.log('\n=== STEP 5: Manual cookie test ===');
    // Try to manually set a cookie to test if it works
    await page.context().addCookies([{
      name: 'test_cookie',
      value: 'test_value',
      domain: new URL(BASE_URL).hostname,
      path: '/'
    }]);
    
    const testCookies = await page.context().cookies();
    console.log('After adding test cookie:', testCookies);

    console.log('\n=== STEP 6: Check browser storage ===');
    const storage = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {}),
        sessionStorage: Object.keys(sessionStorage).reduce((acc, key) => {
          acc[key] = sessionStorage.getItem(key);
          return acc;
        }, {}),
        cookieString: document.cookie
      };
    });
    console.log('Browser storage:', storage);

    console.log('\n=== STEP 7: Test direct API call with credentials ===');
    // Test if we can make API call with credentials
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api.bangachieu2.workers.dev/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Direct API call result:', apiResponse);
  });
});
