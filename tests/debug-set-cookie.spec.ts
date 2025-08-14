import { test, expect } from '@playwright/test';

const BASE_URL = 'https://fc9f4436.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Debug Set-Cookie Header', () => {
  test('should debug Set-Cookie header in detail', async ({ page }) => {
    console.log('\n=== STEP 1: Navigate to login page ===');
    await page.goto(`${BASE_URL}/login`);
    
    console.log('\n=== STEP 2: Capture login response headers ===');
    let loginResponseHeaders = null;
    let setCookieHeader = null;
    
    page.on('response', async response => {
      if (response.url().includes('/auth/login')) {
        console.log('\n=== LOGIN RESPONSE ANALYSIS ===');
        console.log('Status:', response.status());
        
        // Get all headers
        const headers = await response.allHeaders();
        loginResponseHeaders = headers;
        setCookieHeader = headers['set-cookie'];
        
        console.log('All headers:', headers);
        console.log('Set-Cookie header:', setCookieHeader);
        
        // Parse Set-Cookie header
        if (setCookieHeader) {
          console.log('Set-Cookie header analysis:');
          const parts = setCookieHeader.split(';').map(p => p.trim());
          parts.forEach((part, index) => {
            console.log(`  ${index}: ${part}`);
          });
        }
        
        // Get response body
        try {
          const body = await response.json();
          console.log('Response body:', body);
        } catch (e) {
          console.log('Could not parse response body as JSON');
        }
      }
    });
    
    console.log('\n=== STEP 3: Perform login ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    console.log('\n=== STEP 4: Check browser cookie storage ===');
    const cookies = await page.context().cookies();
    console.log('Browser cookies after login:', cookies);
    
    console.log('\n=== STEP 5: Analyze Set-Cookie header format ===');
    if (setCookieHeader) {
      console.log('\nSet-Cookie header format analysis:');
      console.log('Raw header:', setCookieHeader);
      console.log('Header length:', setCookieHeader.length);
      console.log('Contains auth_token:', setCookieHeader.includes('auth_token'));
      console.log('Contains HttpOnly:', setCookieHeader.includes('HttpOnly'));
      console.log('Contains Secure:', setCookieHeader.includes('Secure'));
      console.log('Contains SameSite:', setCookieHeader.includes('SameSite'));
      
      // Check for common issues
      if (setCookieHeader.includes('SameSite=None') && !setCookieHeader.includes('Secure')) {
        console.log('❌ ISSUE: SameSite=None requires Secure flag');
      }
      
      if (!setCookieHeader.includes('Domain=') && !setCookieHeader.includes('domain=')) {
        console.log('⚠️  WARNING: No Domain specified in cookie');
      }
    }
    
    console.log('\n=== STEP 6: Test manual Set-Cookie simulation ===');
    // Try to manually set the cookie using the same format as backend
    if (setCookieHeader) {
      try {
        // Extract cookie name and value
        const match = setCookieHeader.match(/auth_token=([^;]+)/);
        if (match) {
          const tokenValue = match[1];
          console.log('Extracted token value:', tokenValue.substring(0, 50) + '...');
          
          // Set cookie manually
          await page.context().addCookies([{
            name: 'auth_token',
            value: tokenValue,
            domain: 'smartpos-api.bangachieu2.workers.dev',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'None'
          }]);
          
          console.log('Manual cookie set successfully');
          
          // Check if manual cookie works
          const manualCookies = await page.context().cookies();
          console.log('Cookies after manual setting:', manualCookies);
          
          // Test API call with manual cookie
          const apiTest = await page.evaluate(async () => {
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
                body: await response.text()
              };
            } catch (error) {
              return { error: error.message };
            }
          });
          
          console.log('API test with manual cookie:', apiTest);
        }
      } catch (error) {
        console.log('Error in manual cookie test:', error);
      }
    }
  });
});
