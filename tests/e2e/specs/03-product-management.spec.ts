import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * Product Management Tests
 * Tests product list, details, CRUD operations, search, and filtering
 */

test.describe('Product Management', () => {
  let helpers: SmartPOSTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
    await helpers.navigateToPage('products');
    await helpers.waitForDataLoad();
  });

  test('should display product list with real data from D1 database', async ({ page }) => {
    // Verify page title
    await helpers.verifyPageTitle('Quản lý sản phẩm');
    
    // Verify product list table
    await helpers.waitForTableData();
    
    // Verify table headers
    const headers = [
      'Hình ảnh',
      'Tên sản phẩm', 
      'SKU',
      'Danh mục',
      'Giá bán',
      'Tồn kho',
      'Trạng thái',
      'Thao tác'
    ];
    
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
    
    // Verify real products are displayed
    const expectedProducts = [
      'CPU Intel Core i5-13400F',
      'RAM Kingston Fury 16GB DDR4',
      'SSD Samsung 980 500GB',
      'VGA RTX 4060 Ti 16GB'
    ];
    
    for (const product of expectedProducts) {
      await expect(page.locator(`text*="${product}"`)).toBeVisible();
    }
  });

  test('should display correct product information', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Verify product data format
    await expect(page.locator('text*="₫"')).toBeVisible(); // Currency
    await expect(page.locator('text*="CPU-I5-13400F"')).toBeVisible(); // SKU
    await expect(page.locator('text*="Linh kiện máy tính"')).toBeVisible(); // Category
    await expect(page.locator('text*="Hoạt động"')).toBeVisible(); // Status
    
    // Verify stock quantities are numbers
    const stockCells = page.locator('td:has-text(/^\\d+$/)');
    await expect(stockCells.first()).toBeVisible();
  });

  test('should test product search functionality', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Test search with product name
    await helpers.testSearch('CPU Intel', ['CPU Intel Core i5-13400F']);
    
    // Clear search and test with SKU
    await page.fill('input[placeholder*="Tìm kiếm"]', '');
    await helpers.testSearch('CPU-I5', ['CPU Intel Core i5-13400F']);
    
    // Test search with no results
    await page.fill('input[placeholder*="Tìm kiếm"]', '');
    await helpers.testSearch('nonexistent product');
  });

  test('should test category filter', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Test category dropdown
    const categoryDropdown = page.locator('select[name="category"], [role="combobox"]:has-text("Danh mục")');
    if (await categoryDropdown.count() > 0) {
      await categoryDropdown.click();
      
      // Select a category
      await page.click('text*="Linh kiện máy tính"');
      await helpers.waitForDataLoad();
      
      // Verify filtered results
      await expect(page.locator('text*="Linh kiện máy tính"')).toBeVisible();
    }
  });

  test('should test status filter', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Test status filter
    const statusFilter = page.locator('button:has-text("Tồn thấp")');
    if (await statusFilter.count() > 0) {
      await statusFilter.click();
      await helpers.waitForDataLoad();
      
      // Verify filter is applied
      await expect(statusFilter).toHaveClass(/active|selected/);
    }
  });

  test('should test refresh and clear filters', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Test refresh button
    const refreshButton = page.locator('button:has-text("Làm mới")');
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      await helpers.waitForDataLoad();
    }
    
    // Test clear filters button
    const clearButton = page.locator('button:has-text("Xóa bộ lọc")');
    if (await clearButton.count() > 0) {
      await clearButton.click();
      await helpers.waitForDataLoad();
    }
  });

  test('should navigate to product details', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Click on first product link
    const productLink = page.locator('a:has-text("CPU Intel Core i5-13400F")');
    await productLink.click();
    
    // Verify navigation to product detail page
    await page.waitForURL('**/products/1');
    await helpers.verifyPageTitle('Chi tiết sản phẩm');
    
    // Verify product details are displayed
    await expect(page.locator('text*="CPU Intel Core i5-13400F"')).toBeVisible();
    await expect(page.locator('text*="CPU-I5-13400F"')).toBeVisible();
    await expect(page.locator('text*="4.990.000 ₫"')).toBeVisible();
    
    // Verify real data indicator
    await expect(page.locator('text*="Dữ liệu thực tế 100%"')).toBeVisible();
    await expect(page.locator('text*="D1 CLOUDFLARE"')).toBeVisible();
  });

  test('should display detailed product information', async ({ page }) => {
    // Navigate to specific product
    await page.goto('/products/1');
    await helpers.waitForDataLoad();
    
    // Verify all product details sections
    const detailSections = [
      'SKU:',
      'Barcode:',
      'Danh mục:',
      'Giá bán:',
      'Giá vốn:',
      'Lợi nhuận:',
      'Tồn kho:'
    ];
    
    for (const section of detailSections) {
      await expect(page.locator(`text*="${section}"`)).toBeVisible();
    }
    
    // Verify specific values
    await expect(page.locator('text*="8888888888001"')).toBeVisible(); // Barcode
    await expect(page.locator('text*="4.200.000 ₫"')).toBeVisible(); // Cost price
    await expect(page.locator('text*="790.000 ₫"')).toBeVisible(); // Profit
    await expect(page.locator('text*="5 sản phẩm"')).toBeVisible(); // Stock
  });

  test('should test product detail actions', async ({ page }) => {
    await page.goto('/products/1');
    await helpers.waitForDataLoad();
    
    // Test "Quay lại POS" button
    const posButton = page.locator('button:has-text("Quay lại POS")');
    if (await posButton.count() > 0) {
      await expect(posButton).toBeVisible();
    }
    
    // Test "Xem API Raw" button
    const apiButton = page.locator('button:has-text("Xem API Raw")');
    if (await apiButton.count() > 0) {
      await apiButton.click();
      
      // Should open new tab with API data
      const pages = page.context().pages();
      if (pages.length > 1) {
        const apiPage = pages[pages.length - 1];
        await apiPage.waitForLoadState();
        
        // Verify API response
        const content = await apiPage.textContent('body');
        expect(content).toContain('success');
        expect(content).toContain('data');
      }
    }
  });

  test('should test product edit functionality', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Click edit button for first product
    const editButton = page.locator('a:has-text("Sửa")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Should navigate to edit page
      await page.waitForURL('**/products/*/edit');
      
      // Verify edit form is displayed
      await helpers.verifyPageTitle('Chi tiết sản phẩm');
    }
  });

  test('should test add new product navigation', async ({ page }) => {
    // Click "Thêm sản phẩm" button
    const addButton = page.locator('a:has-text("Thêm sản phẩm")');
    await addButton.click();
    
    // Should navigate to new product page
    await page.waitForURL('**/products/new');
    await helpers.verifyPageTitle('Chi tiết sản phẩm');
  });

  test('should test pagination', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Check pagination controls
    const paginationInfo = page.locator('text*="1-8 của 8"');
    await expect(paginationInfo).toBeVisible();
    
    // Check page size selector
    const pageSizeSelector = page.locator('select:has-text("10")');
    if (await pageSizeSelector.count() > 0) {
      await expect(pageSizeSelector).toBeVisible();
    }
    
    // Previous/Next buttons should be disabled for single page
    const prevButton = page.locator('button[aria-label*="previous"]');
    const nextButton = page.locator('button[aria-label*="next"]');
    
    if (await prevButton.count() > 0) {
      await expect(prevButton).toBeDisabled();
    }
    if (await nextButton.count() > 0) {
      await expect(nextButton).toBeDisabled();
    }
  });

  test('should verify API integration', async ({ page }) => {
    // Verify products API endpoint
    await helpers.verifyAPIResponse('/api/v1/products');
    
    // Verify categories API endpoint
    await helpers.verifyAPIResponse('/api/v1/categories');
    
    // Verify real data is loaded
    await helpers.verifyRealDataLoaded();
  });

  test('should test responsive product list design', async ({ page }) => {
    await helpers.testResponsiveDesign();
    
    // Verify table is responsive
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('table')).toBeVisible();
  });

  test('should handle product list errors gracefully', async ({ page }) => {
    await helpers.checkForErrors();
    
    // Verify loading states
    await helpers.waitForDataLoad();
  });

  test('should test product image display', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Check for product images
    const productImages = page.locator('td img');
    if (await productImages.count() > 0) {
      await expect(productImages.first()).toBeVisible();
    }
  });

  test('should test stock status indicators', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Check for stock status indicators
    await expect(page.locator('text*="Hoạt động"')).toBeVisible();
    
    // Check for low stock warnings if any
    const lowStockIndicator = page.locator('text*="Sắp hết"');
    if (await lowStockIndicator.count() > 0) {
      await expect(lowStockIndicator).toBeVisible();
    }
  });
});
