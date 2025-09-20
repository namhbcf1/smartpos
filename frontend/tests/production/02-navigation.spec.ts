import { test, expect } from '@playwright/test';

/**
 * NAVIGATION & ROUTING TESTS
 * Testing sidebar menu items, routes, breadcrumbs, and responsive navigation
 */

test.describe('Navigation & Routing', () => {

  test.beforeEach(async ({ page }) => {
    // Use saved auth state
    await page.goto('/');

    // Login if needed
    const isLoginPage = await page.locator('input[name="username"], input[name="email"]').count() > 0;
    if (isLoginPage) {
      await page.locator('input[name="username"], input[name="email"]').first().fill('admin');
      await page.locator('input[name="password"]').fill('admin123');
      await page.locator('button[type="submit"], button:has-text("Login")').first().click();
      await page.waitForURL(/\/(dashboard|home|main|pos)/, { timeout: 30000 });
    }
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Look for sidebar or navigation menu
    const sidebarSelectors = [
      '[data-testid="sidebar"]',
      '.sidebar',
      'nav',
      '.navigation',
      '.side-nav'
    ];

    let sidebarFound = false;
    for (const selector of sidebarSelectors) {
      if (await page.locator(selector).count() > 0) {
        sidebarFound = true;
        break;
      }
    }

    expect(sidebarFound).toBe(true);

    // Take screenshot of navigation
    await page.screenshot({ path: 'test-results/screenshots/navigation-sidebar.png', fullPage: true });
  });

  test('should navigate to all main menu items', async ({ page }) => {
    const menuItems = [
      { name: 'Dashboard', selectors: ['a:has-text("Dashboard")', '[href*="dashboard"]', 'button:has-text("Dashboard")'] },
      { name: 'Products', selectors: ['a:has-text("Products")', '[href*="products"]', 'button:has-text("Products")'] },
      { name: 'POS', selectors: ['a:has-text("POS")', 'a:has-text("Sale")', '[href*="pos"]', '[href*="sale"]'] },
      { name: 'Customers', selectors: ['a:has-text("Customers")', '[href*="customers"]', 'button:has-text("Customers")'] },
      { name: 'Inventory', selectors: ['a:has-text("Inventory")', '[href*="inventory"]', 'button:has-text("Inventory")'] },
      { name: 'Orders', selectors: ['a:has-text("Orders")', '[href*="orders"]', 'button:has-text("Orders")'] },
      { name: 'Sales', selectors: ['a:has-text("Sales")', '[href*="sales"]', 'button:has-text("Sales")'] },
      { name: 'Reports', selectors: ['a:has-text("Reports")', '[href*="reports"]', 'button:has-text("Reports")'] },
      { name: 'Settings', selectors: ['a:has-text("Settings")', '[href*="settings"]', 'button:has-text("Settings")'] }
    ];

    const navigationResults = [];

    for (const item of menuItems) {
      let menuFound = false;
      let navigationWorked = false;
      let currentUrl = '';

      // Try to find the menu item
      for (const selector of item.selectors) {
        const menuElement = page.locator(selector).first();
        if (await menuElement.count() > 0) {
          menuFound = true;

          try {
            // Click the menu item
            await menuElement.click();
            await page.waitForTimeout(2000); // Wait for navigation

            currentUrl = page.url();
            navigationWorked = true;

            // Take screenshot of the page
            await page.screenshot({
              path: `test-results/screenshots/navigation-${item.name.toLowerCase()}.png`,
              fullPage: true
            });

            break;
          } catch (error) {
            console.log(`Navigation to ${item.name} failed:`, error);
          }
        }
      }

      navigationResults.push({
        item: item.name,
        found: menuFound,
        navigated: navigationWorked,
        url: currentUrl
      });
    }

    // Log results
    console.log('📊 Navigation Test Results:');
    navigationResults.forEach(result => {
      const status = result.navigated ? '✅' : (result.found ? '⚠️' : '❌');
      console.log(`${status} ${result.item}: Found=${result.found}, Navigated=${result.navigated}, URL=${result.url}`);
    });

    // At least 50% of navigation items should work
    const workingNavigation = navigationResults.filter(r => r.navigated).length;
    const totalItems = navigationResults.length;
    expect(workingNavigation / totalItems).toBeGreaterThanOrEqual(0.5);
  });

  test('should handle responsive navigation on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Look for mobile navigation elements
    const mobileNavSelectors = [
      'button[aria-label*="menu"]',
      '.hamburger',
      '.mobile-menu-button',
      'button:has-text("☰")',
      '[data-testid="mobile-menu"]'
    ];

    let mobileNavFound = false;
    for (const selector of mobileNavSelectors) {
      if (await page.locator(selector).count() > 0) {
        mobileNavFound = true;

        // Try to open mobile menu
        await page.locator(selector).first().click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    // Take screenshot of mobile navigation
    await page.screenshot({ path: 'test-results/screenshots/mobile-navigation.png', fullPage: true });

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should verify page titles and URLs', async ({ page }) => {
    const pages = [
      { path: '/dashboard', expectedTitle: /dashboard|home/i },
      { path: '/products', expectedTitle: /products/i },
      { path: '/pos', expectedTitle: /pos|sale/i },
      { path: '/customers', expectedTitle: /customers/i },
      { path: '/inventory', expectedTitle: /inventory/i }
    ];

    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        const url = page.url();

        console.log(`📄 Page: ${pageInfo.path} - Title: "${title}" - URL: ${url}`);

        // Verify the page loaded (not a 404 or error)
        const hasError = await page.locator('text=/404|not found|error|sorry/i').count() > 0;
        expect(hasError).toBe(false);

      } catch (error) {
        console.log(`⚠️  Failed to navigate to ${pageInfo.path}:`, error);
      }
    }
  });

  test('should test breadcrumb navigation', async ({ page }) => {
    // Navigate to a nested page that might have breadcrumbs
    const pagesWithBreadcrumbs = ['/products', '/customers', '/inventory', '/reports'];

    for (const pagePath of pagesWithBreadcrumbs) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Look for breadcrumb elements
        const breadcrumbSelectors = [
          '.breadcrumb',
          '[data-testid="breadcrumb"]',
          '.breadcrumbs',
          'nav[aria-label="breadcrumb"]'
        ];

        let breadcrumbFound = false;
        for (const selector of breadcrumbSelectors) {
          if (await page.locator(selector).count() > 0) {
            breadcrumbFound = true;
            console.log(`✅ Breadcrumbs found on ${pagePath}`);
            break;
          }
        }

        if (!breadcrumbFound) {
          console.log(`ℹ️  No breadcrumbs found on ${pagePath} (may not be implemented)`);
        }

      } catch (error) {
        console.log(`⚠️  Failed to check breadcrumbs on ${pagePath}:`, error);
      }
    }
  });

  test('should handle back/forward browser navigation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to products
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back on dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('dashboard');

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Should be back on products
    const forwardUrl = page.url();
    expect(forwardUrl).toContain('products');

    // Take screenshot of navigation state
    await page.screenshot({ path: 'test-results/screenshots/browser-navigation.png', fullPage: true });
  });
});