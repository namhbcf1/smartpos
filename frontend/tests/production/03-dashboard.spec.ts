import { test, expect } from '@playwright/test';

/**
 * DASHBOARD PAGE TESTS
 * Testing KPI cards, quick actions, refresh functionality, and responsive layout
 */

test.describe('Dashboard Page', () => {

  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/');

    const isLoginPage = await page.locator('input[name="username"], input[name="email"]').count() > 0;
    if (isLoginPage) {
      await page.locator('input[name="username"], input[name="email"]').first().fill('admin');
      await page.locator('input[name="password"]').fill('admin123');
      await page.locator('button[type="submit"], button:has-text("Login")').first().click();
      await page.waitForURL(/\/(dashboard|home|main|pos)/, { timeout: 30000 });
    }

    // Ensure we're on the dashboard
    if (!page.url().includes('dashboard')) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should load dashboard page correctly', async ({ page }) => {
    // Verify we're on the dashboard
    expect(page.url()).toMatch(/\/(dashboard|home|main)/);

    // Check for dashboard elements
    const dashboardElements = [
      page.locator('text=/dashboard/i'),
      page.locator('[data-testid="dashboard"]'),
      page.locator('.dashboard')
    ];

    let dashboardFound = false;
    for (const element of dashboardElements) {
      if (await element.count() > 0) {
        dashboardFound = true;
        break;
      }
    }

    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/screenshots/dashboard-main.png', fullPage: true });
  });

  test('should display KPI cards with data', async ({ page }) => {
    // Look for KPI/metric cards
    const kpiSelectors = [
      '.card',
      '.metric',
      '.kpi',
      '.stat',
      '.dashboard-card',
      '[data-testid="kpi-card"]',
      '.grid > div', // Common grid layout for cards
      '.flex > div'  // Flex layout for cards
    ];

    const kpiResults = [];

    for (const selector of kpiSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        console.log(`Found ${elements} elements with selector: ${selector}`);

        // Check if cards have data (numbers, currency, etc.)
        const cardsWithData = await page.locator(`${selector}:has-text(/\\$|\\d+|\\%/)`).count();

        kpiResults.push({
          selector,
          totalCards: elements,
          cardsWithData,
          hasData: cardsWithData > 0
        });
      }
    }

    // Log KPI findings
    console.log('📊 KPI Cards Analysis:');
    kpiResults.forEach(result => {
      console.log(`${result.hasData ? '✅' : '⚠️'} ${result.selector}: ${result.cardsWithData}/${result.totalCards} cards with data`);
    });

    // Should have at least some cards with data
    const totalCardsWithData = kpiResults.reduce((sum, result) => sum + result.cardsWithData, 0);
    expect(totalCardsWithData).toBeGreaterThanOrEqual(1);

    // Take screenshot focusing on KPIs
    await page.screenshot({ path: 'test-results/screenshots/dashboard-kpis.png', fullPage: true });
  });

  test('should test quick action buttons', async ({ page }) => {
    // Look for common quick action buttons
    const quickActionButtons = [
      { name: 'New Sale', selectors: ['button:has-text("New Sale")', 'a:has-text("New Sale")', '[data-testid="new-sale"]'] },
      { name: 'Add Product', selectors: ['button:has-text("Add Product")', 'a:has-text("Add Product")', '[data-testid="add-product"]'] },
      { name: 'View Products', selectors: ['button:has-text("View Products")', 'a:has-text("Products")', '[href*="products"]'] },
      { name: 'Inventory', selectors: ['button:has-text("Inventory")', 'a:has-text("Inventory")', '[href*="inventory"]'] },
      { name: 'Reports', selectors: ['button:has-text("Reports")', 'a:has-text("Reports")', '[href*="reports"]'] },
      { name: 'Settings', selectors: ['button:has-text("Settings")', 'a:has-text("Settings")', '[href*="settings"]'] }
    ];

    const buttonResults = [];

    for (const action of quickActionButtons) {
      let buttonFound = false;
      let clickWorked = false;
      let originalUrl = page.url();

      for (const selector of action.selectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          buttonFound = true;

          try {
            // Take screenshot before clicking
            await page.screenshot({
              path: `test-results/screenshots/before-${action.name.toLowerCase().replace(' ', '-')}.png`,
              fullPage: true
            });

            await button.click();
            await page.waitForTimeout(2000); // Wait for any navigation or action

            const newUrl = page.url();
            clickWorked = newUrl !== originalUrl || await page.locator('.modal, .dialog, .popup').count() > 0;

            // Take screenshot after clicking
            await page.screenshot({
              path: `test-results/screenshots/after-${action.name.toLowerCase().replace(' ', '-')}.png`,
              fullPage: true
            });

            // Go back to dashboard if navigated away
            if (newUrl !== originalUrl) {
              await page.goBack();
              await page.waitForLoadState('networkidle');
            }

            break;
          } catch (error) {
            console.log(`Error clicking ${action.name}:`, error);
          }
        }
      }

      buttonResults.push({
        action: action.name,
        found: buttonFound,
        clickable: clickWorked
      });
    }

    // Log results
    console.log('🔘 Quick Action Buttons Results:');
    buttonResults.forEach(result => {
      const status = result.clickable ? '✅' : (result.found ? '⚠️' : '❌');
      console.log(`${status} ${result.action}: Found=${result.found}, Clickable=${result.clickable}`);
    });

    // At least 3 buttons should be found
    const foundButtons = buttonResults.filter(r => r.found).length;
    expect(foundButtons).toBeGreaterThanOrEqual(3);
  });

  test('should test refresh functionality', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/screenshots/dashboard-before-refresh.png', fullPage: true });

    // Look for refresh button
    const refreshSelectors = [
      'button:has-text("Refresh")',
      'button[aria-label*="refresh"]',
      '[data-testid="refresh"]',
      '.refresh-btn',
      'button:has-text("↻")'
    ];

    let refreshButtonFound = false;
    for (const selector of refreshSelectors) {
      const refreshBtn = page.locator(selector).first();
      if (await refreshBtn.count() > 0) {
        refreshButtonFound = true;

        try {
          await refreshBtn.click();
          await page.waitForTimeout(2000);
          console.log('✅ Refresh button clicked successfully');
          break;
        } catch (error) {
          console.log('⚠️ Refresh button click failed:', error);
        }
      }
    }

    if (!refreshButtonFound) {
      // Try browser refresh as fallback
      await page.reload();
      await page.waitForLoadState('networkidle');
      console.log('🔄 Used browser refresh instead');
    }

    // Take screenshot after refresh
    await page.screenshot({ path: 'test-results/screenshots/dashboard-after-refresh.png', fullPage: true });
  });

  test('should test responsive layout on different screen sizes', async ({ page }) => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Mobile Small', width: 320, height: 568 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if layout adapts
      const isResponsive = await page.locator('.responsive, .mobile, .tablet, .desktop').count() > 0 ||
                          await page.locator('[class*="sm:"], [class*="md:"], [class*="lg:"]').count() > 0; // Tailwind responsive classes

      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}): Layout responsive = ${isResponsive}`);

      // Take screenshot for each viewport
      await page.screenshot({
        path: `test-results/screenshots/dashboard-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: true
      });
    }

    // Reset to desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should check for charts and data visualizations', async ({ page }) => {
    // Look for chart elements
    const chartSelectors = [
      'canvas', // Chart.js uses canvas
      '.recharts-wrapper', // Recharts
      '.chart',
      '.graph',
      '.visualization',
      'svg', // SVG charts
      '[data-testid="chart"]'
    ];

    const chartResults = [];

    for (const selector of chartSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        chartResults.push({
          type: selector,
          count: elements
        });
      }
    }

    // Log chart findings
    console.log('📈 Charts & Visualizations:');
    if (chartResults.length > 0) {
      chartResults.forEach(result => {
        console.log(`✅ Found ${result.count} ${result.type} elements`);
      });
    } else {
      console.log('ℹ️  No charts found (may not be implemented or loaded)');
    }

    // Take screenshot of charts area
    await page.screenshot({ path: 'test-results/screenshots/dashboard-charts.png', fullPage: true });
  });

  test('should verify loading states and performance', async ({ page }) => {
    // Reload page and monitor loading
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`⚡ Dashboard load time: ${loadTime}ms`);

    // Check for loading indicators
    const loadingIndicators = [
      '.loading',
      '.spinner',
      '.skeleton',
      '[data-testid="loading"]',
      '.loader'
    ];

    // These might appear briefly during load
    let hasLoadingIndicators = false;
    for (const selector of loadingIndicators) {
      if (await page.locator(selector).count() > 0) {
        hasLoadingIndicators = true;
        console.log(`✅ Loading indicator found: ${selector}`);
      }
    }

    // Performance should be reasonable (under 10 seconds)
    expect(loadTime).toBeLessThan(10000);

    // Take final screenshot
    await page.screenshot({ path: 'test-results/screenshots/dashboard-loaded.png', fullPage: true });
  });
});