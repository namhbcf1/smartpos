import { test, expect } from '@playwright/test';

const BASE_URL = 'https://fc9f4436.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Debug AuthContext', () => {
  test('should debug AuthContext behavior after login', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    // Track all API requests
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('smartpos-api')) {
        apiRequests.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
        console.log(`[API REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    console.log('\n=== STEP 1: Navigate to login page ===');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== STEP 2: Perform login ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    console.log('\n=== STEP 3: Check if we are on dashboard ===');
    console.log('Current URL:', page.url());
    
    if (page.url().includes('/login')) {
      console.log('❌ Still on login page');
      return;
    }
    
    console.log('✅ Successfully redirected to dashboard');
    
    console.log('\n=== STEP 4: Check localStorage and cookies ===');
    const storage = await page.evaluate(() => {
      return {
        user: localStorage.getItem('user'),
        cookies: document.cookie
      };
    });
    console.log('Storage:', storage);
    
    console.log('\n=== STEP 5: Wait and observe AuthContext behavior ===');
    // Wait for AuthContext to potentially call /auth/me
    await page.waitForTimeout(5000);
    
    console.log('\n=== STEP 6: Check all API requests made ===');
    console.log('All API requests:', apiRequests);
    
    const authMeRequests = apiRequests.filter(req => req.url.includes('/auth/me'));
    console.log('Auth/me requests:', authMeRequests);
    
    console.log('\n=== STEP 7: Manually trigger page reload to test AuthContext ===');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('URL after reload:', page.url());
    
    console.log('\n=== STEP 8: Check API requests after reload ===');
    const authMeAfterReload = apiRequests.filter(req => 
      req.url.includes('/auth/me') && req.timestamp > Date.now() - 10000
    );
    console.log('Auth/me requests after reload:', authMeAfterReload);
    
    console.log('\n=== STEP 9: Try manual /auth/me call ===');
    const manualAuthCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api.bangachieu2.workers.dev/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Version': '1.0.0'
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
    
    console.log('Manual auth check result:', manualAuthCheck);
  });
});
