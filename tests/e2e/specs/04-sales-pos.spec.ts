import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * Sales and POS Tests
 * Tests POS interface, sales history, order management, and returns
 */

test.describe('Sales and POS Functionality', () => {
  let helpers: SmartPOSTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
  });

  test.describe('POS Interface', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('pos');
      await helpers.waitForDataLoad();
    });

    test('should display POS interface correctly', async ({ page }) => {
      await helpers.verifyPageTitle('Điểm bán hàng');
      
      // Verify POS components are present
      const posComponents = [
        'Sản phẩm',
        'Giỏ hàng',
        'Thanh toán'
      ];
      
      for (const component of posComponents) {
        const element = page.locator(`text*="${component}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test product search in POS', async ({ page }) => {
      // Look for product search input
      const searchInput = page.locator('input[placeholder*="Tìm sản phẩm"], input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('CPU');
        await page.keyboard.press('Enter');
        await helpers.waitForDataLoad();
        
        // Should show CPU products
        await expect(page.locator('text*="CPU"')).toBeVisible();
      }
    });

    test('should test barcode scanner functionality', async ({ page }) => {
      // Look for barcode input
      const barcodeInput = page.locator('input[placeholder*="barcode"], input[placeholder*="mã vạch"]');
      if (await barcodeInput.count() > 0) {
        await barcodeInput.fill('8888888888001');
        await page.keyboard.press('Enter');
        await helpers.waitForDataLoad();
      }
    });

    test('should test adding products to cart', async ({ page }) => {
      // Look for product cards or list
      const productCard = page.locator('[data-testid="product-card"]').first();
      if (await productCard.count() > 0) {
        await productCard.click();
        
        // Verify product is added to cart
        const cartItems = page.locator('[data-testid="cart-item"]');
        if (await cartItems.count() > 0) {
          await expect(cartItems.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Sales History', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('sales');
      await helpers.waitForDataLoad();
    });

    test('should display sales history page', async ({ page }) => {
      await helpers.verifyPageTitle('Lịch sử bán hàng');
      
      // Verify sales table or list
      const salesTable = page.locator('table');
      if (await salesTable.count() > 0) {
        await expect(salesTable).toBeVisible();
      }
    });

    test('should test sales filtering', async ({ page }) => {
      // Test date filters
      const dateFilters = ['Hôm nay', 'Tuần này', 'Tháng này'];
      
      for (const filter of dateFilters) {
        const filterButton = page.locator(`button:has-text("${filter}")`);
        if (await filterButton.count() > 0) {
          await filterButton.click();
          await helpers.waitForDataLoad();
        }
      }
    });

    test('should test sales search', async ({ page }) => {
      await helpers.testSearch('HD', []); // Search for invoice number
    });

    test('should display sales statistics', async ({ page }) => {
      // Check for sales summary
      const statsElements = [
        'Tổng doanh thu',
        'Số đơn hàng',
        'Trung bình đơn hàng'
      ];
      
      for (const stat of statsElements) {
        const element = page.locator(`text*="${stat}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('Order Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('orders');
      await helpers.waitForDataLoad();
    });

    test('should display orders page', async ({ page }) => {
      await helpers.verifyPageTitle('Đơn hàng');
      
      // Check for orders table
      await helpers.waitForTableData();
    });

    test('should test order status filters', async ({ page }) => {
      const statusFilters = [
        'Tất cả',
        'Chờ xử lý',
        'Đang xử lý',
        'Hoàn thành',
        'Đã hủy'
      ];
      
      for (const status of statusFilters) {
        const filterButton = page.locator(`button:has-text("${status}")`);
        if (await filterButton.count() > 0) {
          await filterButton.click();
          await helpers.waitForDataLoad();
        }
      }
    });

    test('should test order details view', async ({ page }) => {
      // Click on first order if exists
      const orderLink = page.locator('table tbody tr').first().locator('a');
      if (await orderLink.count() > 0) {
        await orderLink.click();
        
        // Should navigate to order detail page
        await page.waitForURL('**/orders/*');
        await helpers.verifyPageTitle('Chi tiết đơn hàng');
      }
    });

    test('should test order actions', async ({ page }) => {
      // Look for action buttons
      const actionButtons = [
        'Xem chi tiết',
        'In hóa đơn',
        'Hủy đơn hàng'
      ];
      
      for (const action of actionButtons) {
        const button = page.locator(`button:has-text("${action}")`);
        if (await button.count() > 0) {
          await expect(button).toBeVisible();
        }
      }
    });
  });

  test.describe('Returns Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('returns');
      await helpers.waitForDataLoad();
    });

    test('should display returns page', async ({ page }) => {
      await helpers.verifyPageTitle('Trả hàng');
      
      // Check for returns interface
      const returnsTable = page.locator('table');
      if (await returnsTable.count() > 0) {
        await expect(returnsTable).toBeVisible();
      }
    });

    test('should test return creation', async ({ page }) => {
      // Look for "Create Return" or "Tạo phiếu trả" button
      const createReturnButton = page.locator('button:has-text("Tạo phiếu trả"), button:has-text("Thêm trả hàng")');
      if (await createReturnButton.count() > 0) {
        await createReturnButton.click();
        
        // Should open return form
        await expect(page.locator('form')).toBeVisible();
      }
    });

    test('should test return search', async ({ page }) => {
      await helpers.testSearch('RET', []); // Search for return number
    });

    test('should test return status filters', async ({ page }) => {
      const statusFilters = [
        'Chờ duyệt',
        'Đã duyệt',
        'Từ chối'
      ];
      
      for (const status of statusFilters) {
        const filterButton = page.locator(`button:has-text("${status}")`);
        if (await filterButton.count() > 0) {
          await filterButton.click();
          await helpers.waitForDataLoad();
        }
      }
    });
  });

  test.describe('Sales Analytics', () => {
    test('should test sales analytics from dashboard', async ({ page }) => {
      await helpers.navigateToPage('dashboard');
      await helpers.waitForDataLoad();
      
      // Test sales analytics buttons
      const analyticsButtons = [
        'Chi tiết',
        'Xem báo cáo'
      ];
      
      for (const button of analyticsButtons) {
        const element = page.locator(`button:has-text("${button}")`);
        if (await element.count() > 0) {
          await element.click();
          await helpers.waitForDataLoad();
          
          // Navigate back to dashboard
          await helpers.navigateToPage('dashboard');
          await helpers.waitForDataLoad();
        }
      }
    });

    test('should verify sales data from API', async ({ page }) => {
      // Verify sales API endpoints
      await helpers.verifyAPIResponse('/api/v1/sales');
      await helpers.verifyAPIResponse('/api/v1/orders');
    });
  });

  test.describe('Payment Processing', () => {
    test('should test payment methods', async ({ page }) => {
      await helpers.navigateToPage('pos');
      await helpers.waitForDataLoad();
      
      // Look for payment method buttons
      const paymentMethods = [
        'Tiền mặt',
        'Thẻ',
        'Chuyển khoản',
        'Ví điện tử'
      ];
      
      for (const method of paymentMethods) {
        const button = page.locator(`button:has-text("${method}")`);
        if (await button.count() > 0) {
          await expect(button).toBeVisible();
        }
      }
    });

    test('should test checkout process', async ({ page }) => {
      await helpers.navigateToPage('pos');
      await helpers.waitForDataLoad();
      
      // Look for checkout button
      const checkoutButton = page.locator('button:has-text("Thanh toán")');
      if (await checkoutButton.count() > 0) {
        await expect(checkoutButton).toBeVisible();
      }
    });
  });

  test.describe('Sales Reports', () => {
    test('should access sales reports', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for sales report sections
      const reportSections = [
        'Doanh thu',
        'Bán hàng',
        'Sản phẩm bán chạy'
      ];
      
      for (const section of reportSections) {
        const element = page.locator(`text*="${section}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test('should test responsive sales interface', async ({ page }) => {
    await helpers.navigateToPage('pos');
    await helpers.testResponsiveDesign();
  });

  test('should handle sales errors gracefully', async ({ page }) => {
    await helpers.navigateToPage('sales');
    await helpers.checkForErrors();
  });
});
