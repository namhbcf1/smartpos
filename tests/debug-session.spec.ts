import { test, expect } from '@playwright/test';

const BASE_URL = 'https://fc9f4436.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Debug Session Issues', () => {
  test('should debug session creation and validation', async ({ page }) => {
    console.log('\n=== STEP 1: Login and capture JWT ===');
    
    let jwtToken = '';
    
    // Capture login response
    page.on('response', async response => {
      if (response.url().includes('/auth/login')) {
        const headers = await response.allHeaders();
        const setCookie = headers['set-cookie'];
        if (setCookie) {
          // Extract JWT token from cookie
          const match = setCookie.match(/auth_token=([^;]+)/);
          if (match) {
            jwtToken = match[1];
            console.log('JWT Token captured:', jwtToken.substring(0, 50) + '...');
            
            // Decode JWT to see payload
            try {
              const parts = jwtToken.split('.');
              const payload = JSON.parse(atob(parts[1]));
              console.log('JWT Payload:', payload);
            } catch (e) {
              console.log('Could not decode JWT:', e);
            }
          }
        }
      }
    });

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    console.log('\n=== STEP 2: Test /auth/me endpoint directly ===');
    
    // Test auth/me endpoint with the captured token
    const authMeResponse = await page.evaluate(async (token) => {
      try {
        const response = await fetch('https://smartpos-api.bangachieu2.workers.dev/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `auth_token=${token}`
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
    }, jwtToken);
    
    console.log('Auth/me response:', authMeResponse);
    
    console.log('\n=== STEP 3: Test session endpoints ===');
    
    // Test if we can access other protected endpoints
    const protectedEndpoints = [
      '/api/v1/categories',
      '/api/v1/sales',
      '/api/v1/reports/dashboard'
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await page.evaluate(async (url, token) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `auth_token=${token}`
            }
          });
          
          return {
            url,
            status: response.status,
            body: await response.text()
          };
        } catch (error) {
          return { url, error: error.message };
        }
      }, `${API_URL}${endpoint}`, jwtToken);
      
      console.log(`${endpoint}:`, response);
    }
    
    console.log('\n=== STEP 4: Check browser cookies ===');
    const cookies = await page.context().cookies();
    console.log('All cookies:', cookies);
    
    console.log('\n=== STEP 5: Test manual navigation ===');
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    
    console.log('Final URL:', page.url());
    
    if (page.url().includes('/login')) {
      console.log('❌ Still redirected to login');
    } else {
      console.log('✅ Successfully stayed on dashboard');
    }
  });
});
