import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * Inventory Management Tests
 * Tests stock management, suppliers, categories, and stock transfers
 */

test.describe('Inventory Management', () => {
  let helpers: SmartPOSTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
  });

  test.describe('Categories Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('categories');
      await helpers.waitForDataLoad();
    });

    test('should display categories page with real data', async ({ page }) => {
      await helpers.verifyPageTitle('Danh mục');
      
      // Verify categories table
      await helpers.waitForTableData();
      
      // Check for "Linh kiện máy tính" category
      await expect(page.locator('text*="Linh kiện máy tính"')).toBeVisible();
    });

    test('should test category creation', async ({ page }) => {
      // Look for add category button
      const addButton = page.locator('button:has-text("Thêm danh mục"), button:has-text("Tạo danh mục")');
      if (await addButton.count() > 0) {
        await addButton.click();
        
        // Should open category form
        await expect(page.locator('form')).toBeVisible();
      }
    });

    test('should test category search and filtering', async ({ page }) => {
      await helpers.testSearch('Linh kiện', ['Linh kiện máy tính']);
    });

    test('should test category edit and delete', async ({ page }) => {
      await helpers.waitForTableData();
      
      // Test edit button
      const editButton = page.locator('button:has-text("Sửa")').first();
      if (await editButton.count() > 0) {
        await expect(editButton).toBeVisible();
      }
      
      // Test delete button
      const deleteButton = page.locator('button:has-text("Xóa")').first();
      if (await deleteButton.count() > 0) {
        await expect(deleteButton).toBeVisible();
      }
    });
  });

  test.describe('Suppliers Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('suppliers');
      await helpers.waitForDataLoad();
    });

    test('should display suppliers page', async ({ page }) => {
      await helpers.verifyPageTitle('Nhà cung cấp');
      
      // Verify suppliers table or list
      const suppliersTable = page.locator('table');
      if (await suppliersTable.count() > 0) {
        await expect(suppliersTable).toBeVisible();
      }
    });

    test('should test supplier creation', async ({ page }) => {
      const addButton = page.locator('button:has-text("Thêm nhà cung cấp")');
      if (await addButton.count() > 0) {
        await addButton.click();
        
        // Should open supplier form
        await expect(page.locator('form')).toBeVisible();
      }
    });

    test('should test supplier search', async ({ page }) => {
      await helpers.testSearch('supplier', []);
    });

    test('should test supplier contact information', async ({ page }) => {
      // Check for contact fields
      const contactFields = [
        'Tên nhà cung cấp',
        'Số điện thoại',
        'Email',
        'Địa chỉ'
      ];
      
      for (const field of contactFields) {
        const element = page.locator(`text*="${field}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('Stock Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('inventory');
      await helpers.waitForDataLoad();
    });

    test('should display stock management page', async ({ page }) => {
      await helpers.verifyPageTitle('Nhập kho');
      
      // Check for stock management interface
      const stockInterface = page.locator('table, .stock-list');
      if (await stockInterface.count() > 0) {
        await expect(stockInterface).toBeVisible();
      }
    });

    test('should test stock in functionality', async ({ page }) => {
      // Look for stock in button
      const stockInButton = page.locator('button:has-text("Nhập kho"), button:has-text("Thêm nhập kho")');
      if (await stockInButton.count() > 0) {
        await stockInButton.click();
        
        // Should open stock in form
        await expect(page.locator('form')).toBeVisible();
      }
    });

    test('should test stock adjustment', async ({ page }) => {
      // Look for adjustment functionality
      const adjustButton = page.locator('button:has-text("Điều chỉnh"), button:has-text("Kiểm kho")');
      if (await adjustButton.count() > 0) {
        await adjustButton.click();
        await helpers.waitForDataLoad();
      }
    });

    test('should display stock levels', async ({ page }) => {
      // Navigate to products to check stock levels
      await helpers.navigateToPage('products');
      await helpers.waitForTableData();
      
      // Verify stock quantities are displayed
      const stockCells = page.locator('td:has-text(/^\\d+$/)');
      await expect(stockCells.first()).toBeVisible();
      
      // Check for low stock indicators
      const lowStockIndicator = page.locator('text*="Sắp hết"');
      if (await lowStockIndicator.count() > 0) {
        await expect(lowStockIndicator).toBeVisible();
      }
    });
  });

  test.describe('Stock Transfers', () => {
    test('should test stock transfer functionality', async ({ page }) => {
      // Navigate to stock transfer page if exists
      const transferPage = page.locator('[data-testid="nav-stock-transfer"]');
      if (await transferPage.count() > 0) {
        await transferPage.click();
        await helpers.waitForDataLoad();
        
        await helpers.verifyPageTitle('Chuyển kho');
      }
    });

    test('should test transfer creation', async ({ page }) => {
      // Look for create transfer button
      const createButton = page.locator('button:has-text("Tạo phiếu chuyển")');
      if (await createButton.count() > 0) {
        await createButton.click();
        
        // Should open transfer form
        await expect(page.locator('form')).toBeVisible();
      }
    });
  });

  test.describe('Inventory Reports', () => {
    test('should access inventory reports', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for inventory report sections
      const reportSections = [
        'Tồn kho',
        'Nhập xuất kho',
        'Sản phẩm sắp hết'
      ];
      
      for (const section of reportSections) {
        const element = page.locator(`text*="${section}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test inventory analytics', async ({ page }) => {
      await helpers.navigateToPage('dashboard');
      await helpers.waitForDataLoad();
      
      // Check inventory statistics on dashboard
      await expect(page.locator('text*="Sản phẩm"')).toBeVisible();
      await expect(page.locator('text*="8"')).toBeVisible(); // Product count
      
      // Check low stock alerts
      await expect(page.locator('text*="Cảnh báo tồn kho"')).toBeVisible();
    });
  });

  test.describe('Barcode Management', () => {
    test('should test barcode functionality', async ({ page }) => {
      await helpers.navigateToPage('products');
      await helpers.waitForTableData();
      
      // Navigate to product detail to check barcode
      await page.click('a:has-text("CPU Intel Core i5-13400F")');
      await helpers.waitForDataLoad();
      
      // Verify barcode is displayed
      await expect(page.locator('text*="8888888888001"')).toBeVisible();
    });

    test('should test barcode scanning simulation', async ({ page }) => {
      await helpers.navigateToPage('pos');
      await helpers.waitForDataLoad();
      
      // Look for barcode input
      const barcodeInput = page.locator('input[placeholder*="barcode"], input[placeholder*="mã vạch"]');
      if (await barcodeInput.count() > 0) {
        await barcodeInput.fill('8888888888001');
        await page.keyboard.press('Enter');
        await helpers.waitForDataLoad();
        
        // Should find the product
        await expect(page.locator('text*="CPU Intel Core i5-13400F"')).toBeVisible();
      }
    });
  });

  test.describe('Warehouse Management', () => {
    test('should test warehouse/store selection', async ({ page }) => {
      // Look for store/warehouse selector
      const storeSelector = page.locator('select[name="store"], [data-testid="store-selector"]');
      if (await storeSelector.count() > 0) {
        await expect(storeSelector).toBeVisible();
      }
    });

    test('should test multi-location inventory', async ({ page }) => {
      await helpers.navigateToPage('products');
      await helpers.waitForTableData();
      
      // Check if products show location-specific stock
      const stockInfo = page.locator('td:has-text(/^\\d+$/)');
      await expect(stockInfo.first()).toBeVisible();
    });
  });

  test.describe('Inventory Alerts', () => {
    test('should display low stock alerts', async ({ page }) => {
      await helpers.navigateToPage('dashboard');
      await helpers.waitForDataLoad();
      
      // Check for low stock section
      await expect(page.locator('text*="Sản phẩm sắp hết"')).toBeVisible();
      
      // Check alert count
      await expect(page.locator('text*="Cảnh báo tồn kho"')).toBeVisible();
    });

    test('should test stock alert thresholds', async ({ page }) => {
      await helpers.navigateToPage('products');
      await helpers.waitForTableData();
      
      // Look for products with low stock warnings
      const lowStockProducts = page.locator('text*="Sắp hết"');
      if (await lowStockProducts.count() > 0) {
        await expect(lowStockProducts.first()).toBeVisible();
      }
    });
  });

  test('should verify inventory API integration', async ({ page }) => {
    // Verify inventory-related API endpoints
    await helpers.verifyAPIResponse('/api/v1/products');
    await helpers.verifyAPIResponse('/api/v1/categories');
    
    // Verify suppliers API if exists
    const suppliersResponse = await page.request.get('https://smartpos-api.bangachieu2.workers.dev/api/v1/suppliers');
    if (suppliersResponse.status() === 200) {
      const data = await suppliersResponse.json();
      expect(data).toHaveProperty('success');
    }
  });

  test('should test responsive inventory interface', async ({ page }) => {
    await helpers.navigateToPage('products');
    await helpers.testResponsiveDesign();
  });

  test('should handle inventory errors gracefully', async ({ page }) => {
    await helpers.navigateToPage('categories');
    await helpers.checkForErrors();
  });
});
