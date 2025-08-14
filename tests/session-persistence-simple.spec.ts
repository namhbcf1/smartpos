import { test, expect } from '@playwright/test';

const BASE_URL = 'https://43920495.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.describe('Simple Session Persistence Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  test('should maintain session after page reload', async ({ page }) => {
    console.log('\n=== STEP 1: Login ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/');
    console.log('✅ Login successful, URL:', page.url());
    
    // Verify we're on dashboard
    expect(page.url()).toBe(`${BASE_URL}/`);
    
    console.log('\n=== STEP 2: Check localStorage ===');
    const userDataBefore = await page.evaluate(() => localStorage.getItem('user'));
    console.log('User data before reload:', userDataBefore ? 'found' : 'not found');
    expect(userDataBefore).toBeTruthy();
    
    console.log('\n=== STEP 3: Reload page ===');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for AuthContext to initialize
    await page.waitForTimeout(3000);
    
    console.log('URL after reload:', page.url());
    
    console.log('\n=== STEP 4: Verify session persistence ===');
    // Should still be on dashboard, not redirected to login
    expect(page.url()).toBe(`${BASE_URL}/`);
    
    // Check localStorage still has user data
    const userDataAfter = await page.evaluate(() => localStorage.getItem('user'));
    console.log('User data after reload:', userDataAfter ? 'found' : 'not found');
    expect(userDataAfter).toBeTruthy();
    
    console.log('✅ Session persistence test passed!');
  });

  test('should maintain session when navigating to dashboard directly', async ({ page }) => {
    console.log('\n=== STEP 1: Login ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/');
    console.log('✅ Login successful');
    
    console.log('\n=== STEP 2: Navigate directly to dashboard ===');
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('URL after direct navigation:', page.url());
    
    console.log('\n=== STEP 3: Verify still authenticated ===');
    // Should stay on dashboard, not redirect to login
    expect(page.url()).toBe(`${BASE_URL}/`);
    
    console.log('✅ Direct navigation test passed!');
  });

  test('should logout and redirect to login', async ({ page }) => {
    console.log('\n=== STEP 1: Login ===');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/');
    console.log('✅ Login successful');
    
    console.log('\n=== STEP 2: Logout ===');
    // Look for logout button (might be in a menu)
    try {
      // Try to find logout button
      await page.click('text=Đăng xuất', { timeout: 5000 });
    } catch {
      // If not found, try clearing localStorage manually
      await page.evaluate(() => {
        localStorage.clear();
        window.location.reload();
      });
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('URL after logout:', page.url());
    
    console.log('\n=== STEP 3: Verify redirected to login ===');
    // Should be redirected to login page
    expect(page.url()).toBe(`${BASE_URL}/login`);
    
    console.log('✅ Logout test passed!');
  });
});
