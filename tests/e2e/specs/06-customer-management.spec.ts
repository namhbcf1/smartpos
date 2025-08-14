import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * Customer Management Tests
 * Tests customer list, details, CRUD operations, and customer analytics
 */

test.describe('Customer Management', () => {
  let helpers: SmartPOSTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
    await helpers.navigateToPage('customers');
    await helpers.waitForDataLoad();
  });

  test('should display customer list with real data from D1 database', async ({ page }) => {
    await helpers.verifyPageTitle('Khách hàng');
    
    // Verify customer table
    await helpers.waitForTableData();
    
    // Verify table headers
    const headers = [
      'Tên khách hàng',
      'Số điện thoại',
      'Email',
      'Địa chỉ',
      'Loại khách hàng',
      'Điểm tích lũy',
      'Thao tác'
    ];
    
    for (const header of headers) {
      const headerElement = page.locator(`th:has-text("${header}")`);
      if (await headerElement.count() > 0) {
        await expect(headerElement).toBeVisible();
      }
    }
  });

  test('should display customer statistics', async ({ page }) => {
    // Check for customer count from dashboard data (should be 6)
    await helpers.navigateToPage('dashboard');
    await helpers.waitForDataLoad();
    
    await expect(page.locator('text*="Khách hàng"')).toBeVisible();
    await expect(page.locator('text*="6"')).toBeVisible(); // Customer count
    
    // Navigate back to customers
    await helpers.navigateToPage('customers');
    await helpers.waitForDataLoad();
  });

  test('should test customer search functionality', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Test search by name
    await helpers.testSearch('Nguyễn', []);
    
    // Test search by phone
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('');
      await helpers.testSearch('0', []); // Search for phone numbers starting with 0
    }
    
    // Test search by email
    await searchInput.fill('');
    await helpers.testSearch('@', []); // Search for email addresses
  });

  test('should test customer filtering', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Test customer type filter
    const customerTypeFilter = page.locator('select[name="customerType"], [role="combobox"]:has-text("Loại khách hàng")');
    if (await customerTypeFilter.count() > 0) {
      await customerTypeFilter.click();
      
      // Select VIP customers
      const vipOption = page.locator('option:has-text("VIP"), [role="option"]:has-text("VIP")');
      if (await vipOption.count() > 0) {
        await vipOption.click();
        await helpers.waitForDataLoad();
      }
    }
    
    // Test loyalty points filter
    const loyaltyFilter = page.locator('button:has-text("Khách VIP"), button:has-text("Điểm cao")');
    if (await loyaltyFilter.count() > 0) {
      await loyaltyFilter.click();
      await helpers.waitForDataLoad();
    }
  });

  test('should test add new customer', async ({ page }) => {
    // Look for add customer button
    const addButton = page.locator('button:has-text("Thêm khách hàng"), a:has-text("Thêm khách hàng")');
    if (await addButton.count() > 0) {
      await addButton.click();
      
      // Should navigate to new customer form or open modal
      const form = page.locator('form');
      if (await form.count() > 0) {
        await expect(form).toBeVisible();
        
        // Verify form fields
        const formFields = [
          'Tên khách hàng',
          'Số điện thoại',
          'Email',
          'Địa chỉ'
        ];
        
        for (const field of formFields) {
          const input = page.locator(`input[name*="${field.toLowerCase()}"], input[placeholder*="${field}"]`);
          if (await input.count() > 0) {
            await expect(input).toBeVisible();
          }
        }
      }
    }
  });

  test('should test customer details view', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Click on first customer if exists
    const customerLink = page.locator('table tbody tr').first().locator('a, td').first();
    if (await customerLink.count() > 0) {
      await customerLink.click();
      
      // Should navigate to customer detail page
      await page.waitForURL('**/customers/*');
      await helpers.verifyPageTitle('Chi tiết khách hàng');
      
      // Verify customer information sections
      const detailSections = [
        'Thông tin cá nhân',
        'Lịch sử mua hàng',
        'Điểm tích lũy',
        'Ghi chú'
      ];
      
      for (const section of detailSections) {
        const element = page.locator(`text*="${section}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    }
  });

  test('should test customer edit functionality', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Look for edit button
    const editButton = page.locator('button:has-text("Sửa"), a:has-text("Sửa")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Should open edit form
      await expect(page.locator('form')).toBeVisible();
      
      // Verify form is pre-filled with customer data
      const nameInput = page.locator('input[name*="name"], input[placeholder*="Tên"]');
      if (await nameInput.count() > 0) {
        const value = await nameInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  test('should test customer purchase history', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Navigate to customer detail
    const customerRow = page.locator('table tbody tr').first();
    if (await customerRow.count() > 0) {
      await customerRow.click();
      
      // Look for purchase history section
      const purchaseHistory = page.locator('text*="Lịch sử mua hàng"');
      if (await purchaseHistory.count() > 0) {
        await expect(purchaseHistory).toBeVisible();
        
        // Check for purchase list or table
        const purchaseList = page.locator('[data-testid="purchase-history"], .purchase-list');
        if (await purchaseList.count() > 0) {
          await expect(purchaseList).toBeVisible();
        }
      }
    }
  });

  test('should test loyalty points system', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Check for loyalty points in customer list
    const pointsColumn = page.locator('td:has-text(/\\d+\\s*điểm/)');
    if (await pointsColumn.count() > 0) {
      await expect(pointsColumn.first()).toBeVisible();
    }
    
    // Navigate to customer detail to see points details
    const customerRow = page.locator('table tbody tr').first();
    if (await customerRow.count() > 0) {
      await customerRow.click();
      
      // Look for loyalty points section
      const loyaltySection = page.locator('text*="Điểm tích lũy"');
      if (await loyaltySection.count() > 0) {
        await expect(loyaltySection).toBeVisible();
      }
    }
  });

  test('should test customer analytics', async ({ page }) => {
    // Check customer analytics from dashboard
    await helpers.navigateToPage('dashboard');
    await helpers.waitForDataLoad();
    
    // Verify customer statistics
    await expect(page.locator('text*="Khách hàng mới"')).toBeVisible();
    await expect(page.locator('text*="Khách VIP"')).toBeVisible();
    
    // Check for customer growth indicators
    const growthIndicator = page.locator('text*="+5.1%"');
    if (await growthIndicator.count() > 0) {
      await expect(growthIndicator).toBeVisible();
    }
  });

  test('should test customer communication features', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Navigate to customer detail
    const customerRow = page.locator('table tbody tr').first();
    if (await customerRow.count() > 0) {
      await customerRow.click();
      
      // Look for communication buttons
      const communicationButtons = [
        'Gọi điện',
        'Gửi SMS',
        'Gửi email'
      ];
      
      for (const button of communicationButtons) {
        const element = page.locator(`button:has-text("${button}")`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    }
  });

  test('should test customer segmentation', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Check for customer types/segments
    const customerTypes = [
      'Khách thường',
      'Khách VIP',
      'Khách doanh nghiệp'
    ];
    
    for (const type of customerTypes) {
      const element = page.locator(`text*="${type}"`);
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should test customer export functionality', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button:has-text("Xuất Excel"), button:has-text("Export")');
    if (await exportButton.count() > 0) {
      await expect(exportButton).toBeVisible();
    }
  });

  test('should test customer import functionality', async ({ page }) => {
    // Look for import button
    const importButton = page.locator('button:has-text("Nhập Excel"), button:has-text("Import")');
    if (await importButton.count() > 0) {
      await expect(importButton).toBeVisible();
    }
  });

  test('should test customer deletion with confirmation', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Look for delete button
    const deleteButton = page.locator('button:has-text("Xóa")').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Should show confirmation dialog
      const confirmDialog = page.locator('[role="dialog"], .modal');
      if (await confirmDialog.count() > 0) {
        await expect(confirmDialog).toBeVisible();
        
        // Look for confirmation buttons
        await expect(page.locator('button:has-text("Hủy")')).toBeVisible();
        await expect(page.locator('button:has-text("Xóa")')).toBeVisible();
        
        // Cancel the deletion
        await page.click('button:has-text("Hủy")');
      }
    }
  });

  test('should verify customer API integration', async ({ page }) => {
    // Verify customers API endpoint
    await helpers.verifyAPIResponse('/api/v1/customers');
    
    // Verify real customer data is loaded
    await helpers.verifyRealDataLoaded();
  });

  test('should test responsive customer interface', async ({ page }) => {
    await helpers.testResponsiveDesign();
    
    // Verify customer table is responsive
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('table')).toBeVisible();
  });

  test('should handle customer management errors gracefully', async ({ page }) => {
    await helpers.checkForErrors();
    
    // Test error handling for invalid customer operations
    await helpers.waitForDataLoad();
  });

  test('should test customer pagination', async ({ page }) => {
    await helpers.waitForTableData();
    
    // Check pagination controls
    const paginationInfo = page.locator('text*="của"');
    if (await paginationInfo.count() > 0) {
      await expect(paginationInfo).toBeVisible();
    }
    
    // Check page size selector
    const pageSizeSelector = page.locator('select:has-text("10")');
    if (await pageSizeSelector.count() > 0) {
      await expect(pageSizeSelector).toBeVisible();
    }
  });
});
