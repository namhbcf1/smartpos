import { test, expect } from '@playwright/test';

const BASE_URL = 'https://fc9f4436.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Debug Login Flow', () => {
  test('should debug complete login flow with detailed logging', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    // Enable request/response logging
    page.on('request', request => {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
      if (request.method() === 'POST' && request.url().includes('/auth/login')) {
        console.log(`[LOGIN REQUEST] Headers:`, request.headers());
      }
    });

    page.on('response', response => {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      if (response.url().includes('/auth/login')) {
        console.log(`[LOGIN RESPONSE] Status: ${response.status()}`);
        console.log(`[LOGIN RESPONSE] Headers:`, response.headers());
      }
      if (response.url().includes('/auth/me')) {
        console.log(`[AUTH CHECK] Status: ${response.status()}`);
        console.log(`[AUTH CHECK] Headers:`, response.headers());
      }
    });

    console.log('\n=== STEP 1: Navigate to login page ===');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL:', page.url());
    await expect(page).toHaveURL(/.*login/);

    console.log('\n=== STEP 2: Fill login form ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    
    console.log('Form filled successfully');

    console.log('\n=== STEP 3: Submit login form ===');
    await page.click('button[type="submit"]');
    
    // Wait for login request to complete
    console.log('Waiting for login request...');
    await page.waitForTimeout(2000);
    
    console.log('Current URL after login attempt:', page.url());

    console.log('\n=== STEP 4: Check for success/error messages ===');
    // Check for success toast
    const successToast = page.locator('text=Đăng nhập thành công');
    const errorToast = page.locator('[role="alert"]');
    
    if (await successToast.isVisible({ timeout: 1000 })) {
      console.log('✅ Success toast found');
    } else {
      console.log('❌ No success toast found');
    }
    
    if (await errorToast.isVisible({ timeout: 1000 })) {
      const errorText = await errorToast.textContent();
      console.log('❌ Error toast found:', errorText);
    }

    console.log('\n=== STEP 5: Wait for potential redirect ===');
    // Wait for potential navigation
    try {
      await page.waitForURL(url => !url.includes('/login'), { timeout: 10000 });
      console.log('✅ Redirected away from login page');
      console.log('New URL:', page.url());
    } catch (error) {
      console.log('❌ No redirect occurred, still on login page');
      console.log('Current URL:', page.url());
    }

    console.log('\n=== STEP 6: Check localStorage ===');
    const localStorage = await page.evaluate(() => {
      return {
        user: localStorage.getItem('user'),
        keys: Object.keys(localStorage)
      };
    });
    console.log('LocalStorage:', localStorage);

    console.log('\n=== STEP 7: Check cookies ===');
    const cookies = await page.context().cookies();
    console.log('Cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...', domain: c.domain })));

    console.log('\n=== STEP 8: Manual auth check ===');
    // Try to navigate to dashboard manually
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('URL after manual navigation to dashboard:', page.url());
    
    if (page.url().includes('/login')) {
      console.log('❌ Redirected back to login - authentication failed');
    } else {
      console.log('✅ Successfully accessed dashboard');
    }

    console.log('\n=== STEP 9: Check network requests ===');
    // Check if /auth/me was called
    const authMeRequests = [];
    page.on('request', req => {
      if (req.url().includes('/auth/me')) {
        authMeRequests.push(req);
      }
    });
    
    await page.waitForTimeout(1000);
    console.log('Auth/me requests made:', authMeRequests.length);

    // Take final screenshot
    await page.screenshot({ path: 'debug-login-final.png', fullPage: true });
    console.log('Screenshot saved as debug-login-final.png');
  });
});
