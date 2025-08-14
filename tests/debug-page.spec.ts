import { test, expect } from '@playwright/test';

test.describe('Debug Page Loading', () => {
  test('debug what is actually loading', async ({ page }) => {
    console.log('🔍 Starting debug test...');
    
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    
    // Get page content
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const url = page.url();
    console.log('📍 Current URL:', url);
    
    // Get HTML content
    const htmlContent = await page.content();
    console.log('📝 HTML length:', htmlContent.length);
    console.log('📝 HTML preview:', htmlContent.substring(0, 500));
    
    // Check for any JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ Console error:', msg.text());
      }
    });
    
    // Wait a bit more for any async loading
    await page.waitForTimeout(3000);
    
    // Check if React app loaded
    const reactRoot = await page.locator('#root').count();
    console.log('⚛️ React root elements:', reactRoot);
    
    if (reactRoot > 0) {
      const rootContent = await page.locator('#root').innerHTML();
      console.log('⚛️ Root content preview:', rootContent.substring(0, 200));
    }
    
    // Check for loading states
    const loadingElements = await page.locator('.loading, .spinner, .MuiCircularProgress-root').count();
    console.log('⏳ Loading elements:', loadingElements);
    
    // Check for error messages
    const errorElements = await page.locator('.error, .MuiAlert-root').count();
    console.log('❌ Error elements:', errorElements);
    
    // Look for any form elements
    const inputs = await page.locator('input').count();
    console.log('📝 Input elements:', inputs);
    
    const buttons = await page.locator('button').count();
    console.log('🔘 Button elements:', buttons);
    
    // Check network requests
    const responses: string[] = [];
    page.on('response', response => {
      responses.push(`${response.status()} ${response.url()}`);
      console.log('🌐 Response:', response.status(), response.url());
    });
    
    // Reload page to capture network requests
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log('🌐 Total responses:', responses.length);
    
    // Final check - try to find any text content
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Body text preview:', bodyText?.substring(0, 200));
    
    // Always pass - this is just for debugging
    expect(true).toBe(true);
  });
});
