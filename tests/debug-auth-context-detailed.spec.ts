import { test, expect } from '@playwright/test';

const BASE_URL = 'https://d3d1a12e.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Debug AuthContext Detailed', () => {
  test('should debug AuthContext initialization and checkAuthSilent', async ({ page }) => {
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

    console.log('\n=== STEP 1: Navigate to login and perform login ===');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    console.log('Current URL after login:', page.url());
    
    if (page.url().includes('/login')) {
      console.log('❌ Login failed, still on login page');
      return;
    }
    
    console.log('✅ Login successful, on dashboard');
    
    console.log('\n=== STEP 2: Check localStorage and AuthContext state ===');
    const authState = await page.evaluate(() => {
      return {
        localStorage: {
          user: localStorage.getItem('user'),
          keys: Object.keys(localStorage)
        },
        // Try to access AuthContext state if possible
        windowLocation: window.location.href
      };
    });
    console.log('Auth state:', authState);
    
    console.log('\n=== STEP 3: Reload page to trigger AuthContext initialization ===');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for AuthContext to initialize
    await page.waitForTimeout(5000);
    
    console.log('URL after reload:', page.url());
    
    console.log('\n=== STEP 4: Check if AuthContext called checkAuthSilent ===');
    const authMeRequests = apiRequests.filter(req => req.url.includes('/auth/me'));
    console.log('Auth/me requests:', authMeRequests);
    
    if (authMeRequests.length === 0) {
      console.log('❌ No /auth/me requests found - AuthContext did not call checkAuthSilent');
    } else {
      console.log('✅ Found /auth/me requests - AuthContext called checkAuthSilent');
    }
    
    console.log('\n=== STEP 5: Check browser console for AuthContext logs ===');
    // The console logs should show if checkAuthSilent was called
    
    console.log('\n=== STEP 6: Manual test of /auth/me endpoint ===');
    const manualAuthTest = await page.evaluate(async () => {
      try {
        console.log('Making manual /auth/me request...');
        const response = await fetch('https://smartpos-api.bangachieu2.workers.dev/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Version': '1.0.0'
          }
        });
        
        const result = {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: await response.text()
        };
        
        console.log('Manual auth test result:', result);
        return result;
      } catch (error) {
        console.log('Manual auth test error:', error);
        return { error: error.message };
      }
    });
    
    console.log('Manual auth test result:', manualAuthTest);
    
    console.log('\n=== STEP 7: Check final state ===');
    const finalState = await page.evaluate(() => {
      return {
        url: window.location.href,
        localStorage: localStorage.getItem('user'),
        cookies: document.cookie
      };
    });
    console.log('Final state:', finalState);
    
    if (finalState.url.includes('/login')) {
      console.log('❌ Final result: Redirected back to login');
    } else {
      console.log('✅ Final result: Stayed on dashboard');
    }
  });
});
