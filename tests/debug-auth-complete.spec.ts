import { test, expect } from '@playwright/test';

const BASE_URL = 'https://smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Complete Authentication Debug', () => {
  test('should debug complete authentication flow step by step', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });

    // Track all network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        method: request.method(),
        url: request.url(),
        timestamp: Date.now()
      });
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    });

    // Track all responses
    page.on('response', response => {
      if (response.url().includes('smartpos-api')) {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    console.log('\n=== STEP 1: Navigate to login page ===');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL:', page.url());
    expect(page.url()).toBe(`${BASE_URL}/login`);

    console.log('\n=== STEP 2: Check initial auth state ===');
    const initialAuthState = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('user'),
        cookies: document.cookie,
        url: window.location.href
      };
    });
    console.log('Initial auth state:', initialAuthState);

    console.log('\n=== STEP 3: Perform login ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    
    console.log('Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for login API call to complete
    await page.waitForTimeout(3000);
    
    console.log('\n=== STEP 4: Check post-login state ===');
    const postLoginState = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('user'),
        cookies: document.cookie,
        url: window.location.href
      };
    });
    console.log('Post-login state:', postLoginState);
    console.log('Current URL after login:', page.url());

    // Check if login API was successful
    const loginRequests = requests.filter(req => req.url.includes('/auth/login'));
    console.log('Login requests:', loginRequests.length);

    console.log('\n=== STEP 5: Wait for potential redirect ===');
    await page.waitForTimeout(2000);
    console.log('URL after waiting:', page.url());

    // If still on login page, try manual navigation
    if (page.url().includes('/login')) {
      console.log('Still on login page, trying manual navigation to dashboard...');
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('URL after manual navigation:', page.url());
    }

    console.log('\n=== STEP 6: Check if we reached dashboard ===');
    const finalState = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('user'),
        cookies: document.cookie,
        url: window.location.href,
        title: document.title
      };
    });
    console.log('Final state:', finalState);

    console.log('\n=== STEP 7: Test session persistence with reload ===');
    if (!page.url().includes('/login')) {
      console.log('On dashboard, testing reload...');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Wait for AuthContext to initialize
      
      console.log('URL after reload:', page.url());
      
      const afterReloadState = await page.evaluate(() => {
        return {
          localStorage: localStorage.getItem('user'),
          cookies: document.cookie,
          url: window.location.href
        };
      });
      console.log('After reload state:', afterReloadState);
      
      // Check if /auth/me was called
      const authMeRequests = requests.filter(req => req.url.includes('/auth/me'));
      console.log('Auth/me requests after reload:', authMeRequests.length);
    }

    console.log('\n=== STEP 8: Summary ===');
    console.log('Total requests:', requests.length);
    console.log('Login requests:', requests.filter(req => req.url.includes('/auth/login')).length);
    console.log('Auth/me requests:', requests.filter(req => req.url.includes('/auth/me')).length);
    console.log('Final URL:', page.url());
    
    if (page.url() === `${BASE_URL}/`) {
      console.log('✅ SUCCESS: Authentication working correctly');
    } else if (page.url().includes('/login')) {
      console.log('❌ FAILED: Still on login page');
    } else {
      console.log('⚠️  UNKNOWN: Unexpected URL');
    }
  });
});
