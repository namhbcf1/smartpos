import { test, expect } from '@playwright/test';

/**
 * 🔍 Quick Login Test
 * Testing login with fixed CORS
 */

const APP_URL = 'https://a31953ab.smartpos-web.pages.dev';

test.describe('🔍 Quick Login Test', () => {
  
  test('🔐 Test Login with Fixed CORS', async ({ page }) => {
    console.log('🔐 Testing login with fixed CORS...');
    
    // Go to login page
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Enable console logging
    page.on('console', msg => {
      console.log('📝 Console:', msg.text());
    });
    
    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // Click login
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Check for dashboard elements
    const dashboardVisible = await page.locator('text=Dashboard').count() > 0;
    console.log('Dashboard visible:', dashboardVisible);
    
    if (dashboardVisible) {
      console.log('✅ Login successful - redirected to dashboard');
      
      // Check for more dashboard elements
      const elements = [
        'text=SmartPOS',
        'text=Sales',
        'text=Products',
        'text=Customers',
        'text=Reports'
      ];
      
      for (const element of elements) {
        const isVisible = await page.locator(element).count() > 0;
        console.log(`${element}: ${isVisible ? '✅' : '❌'}`);
      }
      
    } else {
      console.log('❌ Login failed - still on login page');
      
      // Check for error messages
      const errorMessages = page.locator('text=/error/i, text=/failed/i, text=/invalid/i');
      if (await errorMessages.count() > 0) {
        console.log('Error messages found:');
        for (let i = 0; i < await errorMessages.count(); i++) {
          console.log(await errorMessages.nth(i).textContent());
        }
      }
    }
  });
});
