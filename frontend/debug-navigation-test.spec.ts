import { test, expect } from '@playwright/test';

/**
 * 🔍 Debug Navigation Test
 * Testing why navigation elements are not visible/clickable
 */

const APP_URL = 'https://fa3e42bb.smartpos-web.pages.dev';

test.describe('🔍 Debug Navigation Test', () => {
  
  test('🔍 Debug Navigation Elements', async ({ page }) => {
    console.log('🔍 Testing navigation elements...');
    
    // Go to frontend
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Enable console logging
    page.on('console', msg => {
      console.log('📝 Console:', msg.text());
    });
    
    // Login first
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'debug-navigation-dashboard.png', fullPage: true });
    
    // Check for navigation drawer
    const drawer = page.locator('[data-testid="nav-dashboard"], .MuiDrawer-root');
    const drawerCount = await drawer.count();
    console.log('Navigation drawer found:', drawerCount);
    
    // Check for specific navigation items
    const navItems = [
      'Dashboard',
      'Sales', 
      'Products',
      'Customers',
      'Reports'
    ];
    
    for (const item of navItems) {
      try {
        // Try different selectors
        const selectors = [
          `text=${item}`,
          `[data-testid="nav-${item.toLowerCase().replace(/\s+/g, '-')}"]`,
          `.MuiListItemText-primary:has-text("${item}")`,
          `button:has-text("${item}")`
        ];
        
        let found = false;
        for (const selector of selectors) {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            console.log(`✅ ${item} found with selector: ${selector}`);
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.log(`❌ ${item} not found with any selector`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${item}:`, error.message);
      }
    }
    
    // Check if drawer is open
    const drawerOpen = await page.locator('.MuiDrawer-root .MuiDrawer-paper').count() > 0;
    console.log('Drawer paper visible:', drawerOpen);
    
    // Try to click menu button to open drawer
    const menuButton = page.locator('button[aria-label="open drawer"], .MuiIconButton-root:has(.MuiSvgIcon-root)');
    if (await menuButton.count() > 0) {
      console.log('Menu button found, clicking...');
      await menuButton.first().click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after opening drawer
      await page.screenshot({ path: 'debug-navigation-drawer-open.png', fullPage: true });
      
      // Check navigation items again
      for (const item of navItems) {
        const element = page.locator(`text=${item}`);
        const isVisible = await element.count() > 0;
        console.log(`${item} visible after opening drawer:`, isVisible);
      }
    } else {
      console.log('Menu button not found');
    }
    
    // Check for any errors in console
    console.log('🔍 Navigation debug completed');
  });
  
  test('🔍 Check Layout Component', async ({ page }) => {
    console.log('🔍 Checking Layout component...');
    
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for Layout component elements
    const layoutElements = [
      '.MuiAppBar-root',
      '.MuiDrawer-root',
      '.MuiToolbar-root'
    ];
    
    for (const element of layoutElements) {
      const count = await page.locator(element).count();
      console.log(`${element}: ${count}`);
    }
    
    // Check for any CSS issues
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      return {
        overflow: getComputedStyle(body).overflow,
        position: getComputedStyle(body).position,
        width: getComputedStyle(body).width,
        height: getComputedStyle(body).height
      };
    });
    
    console.log('Body styles:', bodyStyles);
    
    // Check for z-index issues
    const drawerZIndex = await page.evaluate(() => {
      const drawer = document.querySelector('.MuiDrawer-root');
      if (drawer) {
        return getComputedStyle(drawer).zIndex;
      }
      return 'not found';
    });
    
    console.log('Drawer z-index:', drawerZIndex);
    
    console.log('🔍 Layout component check completed');
  });
});
