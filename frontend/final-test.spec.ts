import { test, expect } from '@playwright/test';

/**
 * 🚀 Final SmartPOS Test Suite
 * Testing the complete system with correct URLs
 */

const APP_URL = 'https://a31953ab.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev';

test.describe('🎯 Final SmartPOS Test Suite', () => {
  
  test('🔍 1. System Health Check', async ({ page }) => {
    console.log('🔍 Testing system health...');
    
    // Test API health
    const healthResult = await page.evaluate(async () => {
      try {
        const response = await fetch('https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1/health');
        const data = await response.text();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Health API result:', healthResult);
    expect(healthResult.status).toBe(200);
    
    // Test frontend loads
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log('Frontend title:', title);
    expect(title).toContain('SmartPOS');
    
    console.log('✅ System health check passed');
  });

  test('🔐 2. Login Test', async ({ page }) => {
    console.log('🔐 Testing login functionality...');
    
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
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Check for dashboard elements
    const dashboardVisible = await page.locator('text=Dashboard').count() > 0;
    console.log('Dashboard visible:', dashboardVisible);
    
    if (dashboardVisible) {
      console.log('✅ Login successful - redirected to dashboard');
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

  test('📊 3. Dashboard Test', async ({ page }) => {
    console.log('📊 Testing dashboard...');
    
    // Login first
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check dashboard elements
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
    
    // Check for data
    const hasData = await page.locator('text=/[0-9]+/').count() > 0;
    console.log('Has data indicators:', hasData);
    
    console.log('✅ Dashboard test completed');
  });

  test('📦 4. Product Management Test', async ({ page }) => {
    console.log('📦 Testing product management...');
    
    // Login first
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Navigate to products
    await page.click('text=Products');
    await page.waitForLoadState('networkidle');
    
    // Check products page
    const productsVisible = await page.locator('text=Products').count() > 0;
    console.log('Products page visible:', productsVisible);
    
    // Check for product list
    const hasProductList = await page.locator('table').count() > 0;
    console.log('Has product list:', hasProductList);
    
    console.log('✅ Product management test completed');
  });

  test('🛒 5. POS Interface Test', async ({ page }) => {
    console.log('🛒 Testing POS interface...');
    
    // Login first
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Navigate to sales
    await page.click('text=Sales');
    await page.waitForLoadState('networkidle');
    
    // Try to find new sale button
    const newSaleButton = page.locator('button:has-text("New Sale")');
    if (await newSaleButton.count() > 0) {
      await newSaleButton.click();
      await page.waitForLoadState('networkidle');
      
      // Check POS interface
      const posElements = [
        'text=Point of Sale',
        'text=Cart',
        'text=Products'
      ];
      
      for (const element of posElements) {
        const isVisible = await page.locator(element).count() > 0;
        console.log(`${element}: ${isVisible ? '✅' : '❌'}`);
      }
    } else {
      console.log('New Sale button not found');
    }
    
    console.log('✅ POS interface test completed');
  });

  test('👥 6. Customer Management Test', async ({ page }) => {
    console.log('👥 Testing customer management...');
    
    // Login first
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Navigate to customers
    await page.click('text=Customers');
    await page.waitForLoadState('networkidle');
    
    // Check customers page
    const customersVisible = await page.locator('text=Customers').count() > 0;
    console.log('Customers page visible:', customersVisible);
    
    // Check for customer list
    const hasCustomerList = await page.locator('table').count() > 0;
    console.log('Has customer list:', hasCustomerList);
    
    console.log('✅ Customer management test completed');
  });

  test('📈 7. Reports Test', async ({ page }) => {
    console.log('📈 Testing reports...');
    
    // Login first
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Navigate to reports
    await page.click('text=Reports');
    await page.waitForLoadState('networkidle');
    
    // Check reports page
    const reportsVisible = await page.locator('text=Reports').count() > 0;
    console.log('Reports page visible:', reportsVisible);
    
    console.log('✅ Reports test completed');
  });

  test('📱 8. Responsive Design Test', async ({ page }) => {
    console.log('📱 Testing responsive design...');
    
    // Login first
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check if navigation is accessible
      const navigation = page.locator('nav, [role="navigation"]');
      const navVisible = await navigation.count() > 0;
      console.log(`${viewport.name} navigation: ${navVisible ? '✅' : '❌'}`);
    }
    
    console.log('✅ Responsive design test completed');
  });

  test('🏆 9. Final Comprehensive Test', async ({ page }) => {
    console.log('🏆 Running final comprehensive test...');
    
    // Test complete workflow
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Test navigation through all sections
    const sections = ['Dashboard', 'Sales', 'Products', 'Customers', 'Reports'];
    
    for (const section of sections) {
      try {
        await page.click(`text=${section}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const sectionVisible = await page.locator(`text=${section}`).count() > 0;
        console.log(`${section}: ${sectionVisible ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`${section}: ❌ Error - ${error.message}`);
      }
    }
    
    console.log('✅ Final comprehensive test completed');
  });
});
