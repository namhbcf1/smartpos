import { test, expect } from '@playwright/test';

/**
 * 🔍 Debug Page Test
 * Testing page content and JavaScript errors
 */

const APP_URL = 'https://a31953ab.smartpos-web.pages.dev';

test.describe('🔍 Debug Page Test', () => {
  
  test('🔍 Debug Page Content', async ({ page }) => {
    console.log('🔍 Debugging page content...');
    
    // Go to login page
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Enable console logging
    page.on('console', msg => {
      console.log('📝 Console:', msg.text());
    });
    
    // Enable page error logging
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // Click login
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if we're on error page
    const errorPage = await page.locator('text=Oops! Đã xảy ra lỗi').count() > 0;
    console.log('Is error page:', errorPage);
    
    if (errorPage) {
      console.log('❌ Error page detected');
      
      // Get error details
      const errorText = await page.locator('text=Chi tiết lỗi').textContent();
      console.log('Error details:', errorText);
      
      // Get error message
      const errorMessage = await page.locator('text=Cannot read properties').textContent();
      console.log('Error message:', errorMessage);
      
      // Take screenshot
      await page.screenshot({ path: 'error-page.png' });
      console.log('📸 Screenshot saved: error-page.png');
      
    } else {
      console.log('✅ No error page detected');
      
      // Check for dashboard elements
      const dashboardElements = [
        'text=Dashboard',
        'text=SmartPOS',
        'text=Sales',
        'text=Products',
        'text=Customers',
        'text=Reports'
      ];
      
      for (const element of dashboardElements) {
        const isVisible = await page.locator(element).count() > 0;
        console.log(`${element}: ${isVisible ? '✅' : '❌'}`);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'dashboard-page.png' });
      console.log('📸 Screenshot saved: dashboard-page.png');
    }
    
    // Get page HTML for debugging
    const pageContent = await page.content();
    console.log('Page HTML (first 1000 chars):', pageContent.substring(0, 1000));
  });
});
