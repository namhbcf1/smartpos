import { test, expect } from '@playwright/test';

/**
 * 🔍 Simple Login Test
 * Testing login API directly
 */

test.describe('🔍 Simple Login Test', () => {
  
  test('🔍 Test Login API Directly', async ({ page }) => {
    console.log('🔍 Testing login API directly...');
    
    // Test login API directly in browser context
    const result = await page.evaluate(async () => {
      try {
        console.log('🌐 Making login request...');
        
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
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.text();
        console.log('📄 Response data:', data);
        
        return {
          success: true,
          status: response.status,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        console.error('❌ Error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('🔍 Login API result:', result);
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    
    // Parse the response data
    const responseData = JSON.parse(result.data);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toHaveProperty('token');
    expect(responseData.data).toHaveProperty('user');
    
    console.log('✅ Login API test passed');
  });

  test('🔍 Test Login Flow in Frontend', async ({ page }) => {
    console.log('🔍 Testing login flow in frontend...');
    
    // Go to login page
    await page.goto('https://23c8e94b.smartpos-web.pages.dev');
    await page.waitForLoadState('networkidle');
    
    // Enable console logging
    page.on('console', msg => {
      console.log('📝 Console:', msg.text());
    });
    
    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // Click login button
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
    
    console.log('🔍 Login flow test completed');
  });
});
