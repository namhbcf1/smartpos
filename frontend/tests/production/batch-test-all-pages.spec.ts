import { test, expect } from '@playwright/test';

/**
 * BATCH TESTING ALL PAGES - Split into manageable chunks
 */

const PRODUCTION_URL = 'https://bb9f942a.namhbcf-uk.pages.dev';

// All 39 pages organized by modules
const allPages = {
  main: [
    { url: '/dashboard', name: 'Dashboard' },
    { url: '/pos', name: 'POS' },
    { url: '/products', name: 'Products' },
    { url: '/customers', name: 'Customers' },
    { url: '/inventory', name: 'Inventory' },
    { url: '/sales', name: 'Sales' },
    { url: '/orders', name: 'Orders' },
    { url: '/reports', name: 'Reports' },
    { url: '/finance', name: 'Finance' },
    { url: '/settings', name: 'Settings' }
  ],
  products: [
    { url: '/products/new', name: 'Add Product' },
    { url: '/products/categories', name: 'Categories' },
    { url: '/products/import', name: 'Import Products' },
    { url: '/products/export', name: 'Export Products' }
  ],
  customers: [
    { url: '/customers/new', name: 'Add Customer' },
    { url: '/customers/import', name: 'Import Customers' },
    { url: '/customers/groups', name: 'Customer Groups' }
  ],
  inventory: [
    { url: '/inventory/stock-check', name: 'Stock Check' },
    { url: '/inventory/stock-in', name: 'Stock In' },
    { url: '/inventory/stock-out', name: 'Stock Out' },
    { url: '/inventory/transfer', name: 'Transfer' },
    { url: '/inventory/adjustment', name: 'Adjustment' }
  ],
  sales: [
    { url: '/sales/new', name: 'New Sale' },
    { url: '/returns', name: 'Returns' }
  ],
  orders: [
    { url: '/orders/pending', name: 'Pending Orders' },
    { url: '/orders/processing', name: 'Processing' },
    { url: '/orders/completed', name: 'Completed' }
  ],
  reports: [
    { url: '/reports/sales', name: 'Sales Report' },
    { url: '/reports/products', name: 'Product Report' },
    { url: '/reports/customers', name: 'Customer Report' },
    { url: '/reports/inventory', name: 'Inventory Report' },
    { url: '/reports/profit', name: 'Profit Report' }
  ],
  finance: [
    { url: '/finance/revenue', name: 'Revenue' },
    { url: '/finance/expenses', name: 'Expenses' },
    { url: '/accounts', name: 'Accounts' }
  ],
  system: [
    { url: '/settings/users', name: 'Users' },
    { url: '/settings/stores', name: 'Stores' },
    { url: '/settings/printers', name: 'Printers' },
    { url: '/profile', name: 'Profile' },
    { url: '/users', name: 'User Management' }
  ]
};

async function loginToSystem(page: any) {
  await page.goto(PRODUCTION_URL);
  await page.waitForLoadState('networkidle');

  const usernameInput = page.locator('input[placeholder*="admin"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const loginButton = page.locator('button:has-text("Đăng nhập")').first();

  await usernameInput.fill('admin');
  await passwordInput.fill('admin123');
  await loginButton.click();
  await page.waitForTimeout(3000);
}

test.describe('Batch Testing All Pages', () => {

  test('should test main pages (10 pages)', async ({ page }) => {
    await loginToSystem(page);

    let stats = { total: 0, success: 0, buttons: 0, inputs: 0 };

    for (const pageInfo of allPages.main) {
      console.log(`🔍 Testing: ${pageInfo.name}`);
      stats.total++;

      try {
        await page.goto(`${PRODUCTION_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const hasError = await page.locator('text=/404|not found|error/i').count() === 0;
        if (hasError) {
          stats.success++;
          const buttons = await page.locator('button').count();
          const inputs = await page.locator('input').count();
          stats.buttons += buttons;
          stats.inputs += inputs;
          console.log(`  ✅ Success - ${buttons} buttons, ${inputs} inputs`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${pageInfo.name}`);
      }
    }

    console.log(`📊 Main Pages: ${stats.success}/${stats.total} success, ${stats.buttons} buttons, ${stats.inputs} inputs`);
    expect(stats.success).toBeGreaterThan(7);
  });

  test('should test product pages (4 pages)', async ({ page }) => {
    await loginToSystem(page);

    let stats = { total: 0, success: 0, buttons: 0, inputs: 0 };

    for (const pageInfo of allPages.products) {
      console.log(`🔍 Testing: ${pageInfo.name}`);
      stats.total++;

      try {
        await page.goto(`${PRODUCTION_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const hasError = await page.locator('text=/404|not found|error/i').count() === 0;
        if (hasError) {
          stats.success++;
          const buttons = await page.locator('button').count();
          const inputs = await page.locator('input').count();
          stats.buttons += buttons;
          stats.inputs += inputs;
          console.log(`  ✅ Success - ${buttons} buttons, ${inputs} inputs`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${pageInfo.name}`);
      }
    }

    console.log(`📊 Product Pages: ${stats.success}/${stats.total} success, ${stats.buttons} buttons, ${stats.inputs} inputs`);
    expect(stats.success).toBeGreaterThan(2);
  });

  test('should test customer pages (3 pages)', async ({ page }) => {
    await loginToSystem(page);

    let stats = { total: 0, success: 0, buttons: 0, inputs: 0 };

    for (const pageInfo of allPages.customers) {
      console.log(`🔍 Testing: ${pageInfo.name}`);
      stats.total++;

      try {
        await page.goto(`${PRODUCTION_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const hasError = await page.locator('text=/404|not found|error/i').count() === 0;
        if (hasError) {
          stats.success++;
          const buttons = await page.locator('button').count();
          const inputs = await page.locator('input').count();
          stats.buttons += buttons;
          stats.inputs += inputs;
          console.log(`  ✅ Success - ${buttons} buttons, ${inputs} inputs`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${pageInfo.name}`);
      }
    }

    console.log(`📊 Customer Pages: ${stats.success}/${stats.total} success, ${stats.buttons} buttons, ${stats.inputs} inputs`);
    expect(stats.success).toBeGreaterThan(1);
  });

  test('should test inventory pages (5 pages)', async ({ page }) => {
    await loginToSystem(page);

    let stats = { total: 0, success: 0, buttons: 0, inputs: 0 };

    for (const pageInfo of allPages.inventory) {
      console.log(`🔍 Testing: ${pageInfo.name}`);
      stats.total++;

      try {
        await page.goto(`${PRODUCTION_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const hasError = await page.locator('text=/404|not found|error/i').count() === 0;
        if (hasError) {
          stats.success++;
          const buttons = await page.locator('button').count();
          const inputs = await page.locator('input').count();
          stats.buttons += buttons;
          stats.inputs += inputs;
          console.log(`  ✅ Success - ${buttons} buttons, ${inputs} inputs`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${pageInfo.name}`);
      }
    }

    console.log(`📊 Inventory Pages: ${stats.success}/${stats.total} success, ${stats.buttons} buttons, ${stats.inputs} inputs`);
    expect(stats.success).toBeGreaterThan(3);
  });

  test('should test sales and order pages (5 pages)', async ({ page }) => {
    await loginToSystem(page);

    let stats = { total: 0, success: 0, buttons: 0, inputs: 0 };

    const salesPages = [...allPages.sales, ...allPages.orders];

    for (const pageInfo of salesPages) {
      console.log(`🔍 Testing: ${pageInfo.name}`);
      stats.total++;

      try {
        await page.goto(`${PRODUCTION_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const hasError = await page.locator('text=/404|not found|error/i').count() === 0;
        if (hasError) {
          stats.success++;
          const buttons = await page.locator('button').count();
          const inputs = await page.locator('input').count();
          stats.buttons += buttons;
          stats.inputs += inputs;
          console.log(`  ✅ Success - ${buttons} buttons, ${inputs} inputs`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${pageInfo.name}`);
      }
    }

    console.log(`📊 Sales/Order Pages: ${stats.success}/${stats.total} success, ${stats.buttons} buttons, ${stats.inputs} inputs`);
    expect(stats.success).toBeGreaterThan(3);
  });

  test('should test report pages (5 pages)', async ({ page }) => {
    await loginToSystem(page);

    let stats = { total: 0, success: 0, buttons: 0, inputs: 0 };

    for (const pageInfo of allPages.reports) {
      console.log(`🔍 Testing: ${pageInfo.name}`);
      stats.total++;

      try {
        await page.goto(`${PRODUCTION_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const hasError = await page.locator('text=/404|not found|error/i').count() === 0;
        if (hasError) {
          stats.success++;
          const buttons = await page.locator('button').count();
          const inputs = await page.locator('input').count();
          stats.buttons += buttons;
          stats.inputs += inputs;
          console.log(`  ✅ Success - ${buttons} buttons, ${inputs} inputs`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${pageInfo.name}`);
      }
    }

    console.log(`📊 Report Pages: ${stats.success}/${stats.total} success, ${stats.buttons} buttons, ${stats.inputs} inputs`);
    expect(stats.success).toBeGreaterThan(3);
  });

  test('should test system and finance pages (8 pages)', async ({ page }) => {
    await loginToSystem(page);

    let stats = { total: 0, success: 0, buttons: 0, inputs: 0 };

    const systemPages = [...allPages.finance, ...allPages.system];

    for (const pageInfo of systemPages) {
      console.log(`🔍 Testing: ${pageInfo.name}`);
      stats.total++;

      try {
        await page.goto(`${PRODUCTION_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const hasError = await page.locator('text=/404|not found|error/i').count() === 0;
        if (hasError) {
          stats.success++;
          const buttons = await page.locator('button').count();
          const inputs = await page.locator('input').count();
          stats.buttons += buttons;
          stats.inputs += inputs;
          console.log(`  ✅ Success - ${buttons} buttons, ${inputs} inputs`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${pageInfo.name}`);
      }
    }

    console.log(`📊 System/Finance Pages: ${stats.success}/${stats.total} success, ${stats.buttons} buttons, ${stats.inputs} inputs`);
    expect(stats.success).toBeGreaterThan(5);
  });

});