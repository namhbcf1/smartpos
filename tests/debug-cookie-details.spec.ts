import { test, expect } from '@playwright/test';

const BASE_URL = 'https://fc9f4436.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Debug Cookie Details', () => {
  test('should debug cookie behavior in detail', async ({ page }) => {
    console.log('\n=== STEP 1: Navigate to login page ===');
    await page.goto(`${BASE_URL}/login`);
    
    console.log('\n=== STEP 2: Check initial cookies ===');
    const initialCookies = await page.context().cookies();
    console.log('Initial cookies:', initialCookies);
    
    console.log('\n=== STEP 3: Perform login ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    console.log('\n=== STEP 4: Check cookies after login ===');
    const afterLoginCookies = await page.context().cookies();
    console.log('Cookies after login:', afterLoginCookies);
    
    // Check cookies for all domains
    const allDomainCookies = await page.context().cookies();
    console.log('All domain cookies:', allDomainCookies);
    
    // Check cookies for specific domains
    const frontendCookies = await page.context().cookies(BASE_URL);
    console.log('Frontend domain cookies:', frontendCookies);
    
    const apiCookies = await page.context().cookies(API_URL);
    console.log('API domain cookies:', apiCookies);
    
    console.log('\n=== STEP 5: Check document.cookie ===');
    const documentCookie = await page.evaluate(() => document.cookie);
    console.log('document.cookie:', documentCookie);
    
    console.log('\n=== STEP 6: Test manual cookie setting ===');
    // Try to set a cookie manually for the API domain
    await page.context().addCookies([{
      name: 'test_cookie',
      value: 'test_value',
      domain: 'smartpos-api.bangachieu2.workers.dev',
      path: '/',
      secure: true,
      sameSite: 'None'
    }]);
    
    const afterManualCookies = await page.context().cookies();
    console.log('After manual cookie setting:', afterManualCookies);
    
    console.log('\n=== STEP 7: Test API call with manual cookie ===');
    const testApiCall = await page.evaluate(async () => {
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
    
    console.log('API call with cookies result:', testApiCall);
    
    console.log('\n=== STEP 8: Check request headers ===');
    // Intercept next request to see headers
    let requestHeaders = null;
    page.on('request', request => {
      if (request.url().includes('/auth/me')) {
        requestHeaders = request.headers();
        console.log('Request headers for /auth/me:', requestHeaders);
      }
    });
    
    // Make another API call
    await page.evaluate(async () => {
      try {
        await fetch('https://smartpos-api.bangachieu2.workers.dev/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.log('Error:', error);
      }
    });
    
    await page.waitForTimeout(1000);
    console.log('Final request headers:', requestHeaders);
  });
});
