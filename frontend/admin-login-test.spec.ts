import { test, expect } from '@playwright/test';

/**
 * 🚀 SmartPOS Admin Login & Functionality Test Suite
 * Testing with admin/admin credentials
 */

const APP_URL = 'https://23c8e94b.smartpos-web.pages.dev';

test.describe('🎯 SmartPOS Admin Login & Functionality Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page
    const isLoginPage = await page.locator('text=SmartPOS Login').count() > 0;
    
    if (isLoginPage) {
      console.log('🔐 Logging in with admin/admin...');
      
      // Fill login form
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin');
      
      // Click sign in button
      await page.click('button:has-text("Sign In")');
      
      // Wait for redirect to dashboard
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      console.log('✅ Login completed');
    } else {
      console.log('✅ Already logged in');
    }
  });

  test('🔍 1. Login and Dashboard Access', async ({ page }) => {
    console.log('🔍 Testing login and dashboard...');
    
    // Verify we're on dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SmartPOS')).toBeVisible();
    
    // Check for dashboard elements
    const dashboardElements = [
      'text=Dashboard',
      'text=Sales',
      'text=Products', 
      'text=Customers',
      'text=Reports'
    ];
    
    for (const element of dashboardElements) {
      await expect(page.locator(element)).toBeVisible({ timeout: 5000 });
    }
    
    console.log('✅ Dashboard loaded successfully');
  });

  test('📦 2. Product Management', async ({ page }) => {
    console.log('📦 Testing product management...');
    
    // Navigate to products
    await page.click('text=Products');
    await page.waitForLoadState('networkidle');
    
    // Verify products page
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Product Management')).toBeVisible();
    
    // Check for product list
    await expect(page.locator('table')).toBeVisible();
    
    console.log('✅ Product management page loaded');
  });

  test('🛒 3. POS Interface', async ({ page }) => {
    console.log('🛒 Testing POS interface...');
    
    // Navigate to new sale
    await page.click('text=Sales');
    await page.waitForLoadState('networkidle');
    
    // Click new sale button
    await page.click('button:has-text("New Sale")');
    await page.waitForLoadState('networkidle');
    
    // Verify POS interface
    await expect(page.locator('text=Point of Sale')).toBeVisible();
    await expect(page.locator('text=Cart')).toBeVisible();
    
    console.log('✅ POS interface loaded');
  });

  test('👥 4. Customer Management', async ({ page }) => {
    console.log('👥 Testing customer management...');
    
    // Navigate to customers
    await page.click('text=Customers');
    await page.waitForLoadState('networkidle');
    
    // Verify customers page
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('text=Customer Management')).toBeVisible();
    
    console.log('✅ Customer management page loaded');
  });

  test('📈 5. Reports Section', async ({ page }) => {
    console.log('📈 Testing reports...');
    
    // Navigate to reports
    await page.click('text=Reports');
    await page.waitForLoadState('networkidle');
    
    // Verify reports page
    await expect(page.locator('text=Reports')).toBeVisible();
    
    console.log('✅ Reports page loaded');
  });

  test('⚙️ 6. Settings Page', async ({ page }) => {
    console.log('⚙️ Testing settings...');
    
    // Navigate to settings
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');
    
    // Verify settings page
    await expect(page.locator('text=Settings')).toBeVisible();
    
    console.log('✅ Settings page loaded');
  });

  test('🎯 7. Complete Workflow Test', async ({ page }) => {
    console.log('🎯 Testing complete workflow...');
    
    // Test navigation through all main sections
    const sections = ['Dashboard', 'Sales', 'Products', 'Customers', 'Reports', 'Settings'];
    
    for (const section of sections) {
      await page.click(`text=${section}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`text=${section}`)).toBeVisible();
      console.log(`✅ ${section} section works`);
    }
    
    console.log('✅ Complete workflow test passed');
  });

  test('📱 8. Responsive Design', async ({ page }) => {
    console.log('📱 Testing responsive design...');
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Verify navigation is accessible
      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation).toBeVisible({ timeout: 5000 });
      
      console.log(`✅ ${viewport.name} viewport tested`);
    }
  });

  test('🔗 9. API Connectivity', async ({ page }) => {
    console.log('🔗 Testing API connectivity...');
    
    // Check if API calls are working by looking for data
    await page.goto(`${APP_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Look for data indicators
    const hasData = await page.locator('text=/[0-9]+/').count() > 0;
    expect(hasData).toBeTruthy();
    
    console.log('✅ API connectivity verified');
  });

  test('🏆 10. Final Verification', async ({ page }) => {
    console.log('🏆 Final verification...');
    
    // Go back to dashboard
    await page.goto(`${APP_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Verify critical elements
    const criticalElements = [
      'text=Dashboard',
      'text=SmartPOS',
      'nav, [role="navigation"]'
    ];
    
    for (const element of criticalElements) {
      await expect(page.locator(element)).toBeVisible({ timeout: 5000 });
    }
    
    console.log('✅ All critical elements verified');
  });
});
