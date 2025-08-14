import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * Dashboard Tests
 * Tests dashboard statistics, charts, real-time data, and UI components
 */

test.describe('Dashboard Functionality', () => {
  let helpers: SmartPOSTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
    // Use saved authentication state
    await page.goto('/dashboard');
    await helpers.waitForDataLoad();
  });

  test('should display dashboard with real data from D1 database', async ({ page }) => {
    // Verify page title and heading
    await helpers.verifyPageTitle('SmartPOS');
    
    // Verify welcome message
    await expect(page.locator('text*="Xin chào, admin"')).toBeVisible();
    
    // Verify real data indicators
    await helpers.verifyRealDataLoaded();
    
    // Verify statistics cards are present
    const statsCards = [
      'Doanh thu hôm nay',
      'Doanh thu tuần',
      'Sản phẩm',
      'Khách hàng'
    ];
    
    for (const stat of statsCards) {
      await expect(page.locator(`text*="${stat}"`)).toBeVisible();
    }
  });

  test('should display correct statistics from database', async ({ page }) => {
    // Wait for data to load
    await helpers.waitForDataLoad();
    
    // Verify product count (should be 8 based on previous test)
    await expect(page.locator('text*="8"')).toBeVisible();
    
    // Verify customer count (should be 6 based on previous test)
    await expect(page.locator('text*="6"')).toBeVisible();
    
    // Verify currency format (Vietnamese Dong)
    await expect(page.locator('text*="₫"')).toBeVisible();
    
    // Verify real-time timestamp
    await expect(page.locator('text*="Cập nhật:"')).toBeVisible();
  });

  test('should test time period filters', async ({ page }) => {
    // Test time period buttons
    const timeFilters = ['Hôm nay', 'Tuần', 'Tháng'];
    
    for (const filter of timeFilters) {
      const filterButton = page.locator(`button:has-text("${filter}")`);
      if (await filterButton.count() > 0) {
        await filterButton.click();
        await helpers.waitForDataLoad();
        
        // Verify the button is selected/active
        await expect(filterButton).toHaveAttribute('aria-pressed', 'true');
      }
    }
  });

  test('should test dashboard action buttons', async ({ page }) => {
    // Test refresh button
    const refreshButton = page.locator('button:has-text("Làm mới")');
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      await helpers.waitForDataLoad();
    }
    
    // Test fullscreen button
    const fullscreenButton = page.locator('button[title*="toàn màn hình"], button:has-text("Chế độ toàn màn hình")');
    if (await fullscreenButton.count() > 0) {
      await fullscreenButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Test notification button
    const notificationButton = page.locator('button:has-text("Thông báo")');
    if (await notificationButton.count() > 0) {
      await notificationButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display charts and visualizations', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(3000);
    
    // Check for chart containers
    const chartSections = [
      'Biểu đồ doanh thu',
      'Phân bố theo danh mục'
    ];
    
    for (const section of chartSections) {
      await expect(page.locator(`text*="${section}"`)).toBeVisible();
    }
    
    // Verify chart elements are present (SVG or Canvas)
    const chartElements = page.locator('svg, canvas');
    if (await chartElements.count() > 0) {
      await expect(chartElements.first()).toBeVisible();
    }
  });

  test('should display recent orders section', async ({ page }) => {
    // Check for recent orders section
    await expect(page.locator('text*="Đơn hàng gần đây"')).toBeVisible();
    
    // Check for "View all" button
    const viewAllButton = page.locator('button:has-text("Xem tất cả")');
    if (await viewAllButton.count() > 0) {
      await expect(viewAllButton).toBeVisible();
    }
    
    // If no orders, should show empty state
    const emptyState = page.locator('text*="Chưa có đơn hàng nào"');
    if (await emptyState.count() > 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should display low stock alerts', async ({ page }) => {
    // Check for low stock section
    await expect(page.locator('text*="Sản phẩm sắp hết"')).toBeVisible();
    
    // Check for manage inventory button
    const manageButton = page.locator('button:has-text("Quản lý kho")');
    if (await manageButton.count() > 0) {
      await expect(manageButton).toBeVisible();
    }
    
    // If no low stock items, should show message
    const noLowStock = page.locator('text*="Tất cả sản phẩm đều có đủ hàng"');
    if (await noLowStock.count() > 0) {
      await expect(noLowStock).toBeVisible();
    }
  });

  test('should test real-time data updates', async ({ page }) => {
    // Check for real-time indicators
    await expect(page.locator('text*="REALTIME"')).toBeVisible();
    await expect(page.locator('text*="Kết nối realtime"')).toBeVisible();
    
    // Test refresh connection button
    const refreshConnectionButton = page.locator('button:has-text("Làm mới kết nối")');
    if (await refreshConnectionButton.count() > 0) {
      await refreshConnectionButton.click();
      await helpers.waitForDataLoad();
    }
    
    // Verify timestamp updates
    const timestampElement = page.locator('text*="Cập nhật:"');
    if (await timestampElement.count() > 0) {
      const initialTime = await timestampElement.textContent();
      
      // Wait and check if timestamp updates
      await page.waitForTimeout(2000);
      const updatedTime = await timestampElement.textContent();
      
      // Note: This might not always change depending on update frequency
      console.log(`Initial: ${initialTime}, Updated: ${updatedTime}`);
    }
  });

  test('should test AI insights section', async ({ page }) => {
    // Check for AI insights
    const aiSection = page.locator('text*="AI Insights"');
    if (await aiSection.count() > 0) {
      await expect(aiSection).toBeVisible();
      
      // Check for insights content
      await expect(page.locator('text*="Hiệu suất hôm nay"')).toBeVisible();
    }
  });

  test('should test quick actions menu', async ({ page }) => {
    // Look for quick actions button
    const quickActionsButton = page.locator('button:has-text("Quick Actions")');
    if (await quickActionsButton.count() > 0) {
      await quickActionsButton.click();
      
      // Check for menu items
      const menuItems = [
        'Bán hàng mới',
        'Thêm sản phẩm',
        'Xem báo cáo',
        'Cài đặt'
      ];
      
      for (const item of menuItems) {
        await expect(page.locator(`text*="${item}"`)).toBeVisible();
      }
    }
  });

  test('should test navigation from dashboard', async ({ page }) => {
    // Test navigation to different sections from dashboard cards
    const navigationTests = [
      { text: 'Chi tiết', expectedUrl: 'dashboard' },
      { text: 'Quản lý', expectedUrl: 'products' },
      { text: 'Xem tất cả', expectedUrl: 'customers' }
    ];
    
    for (const nav of navigationTests) {
      const button = page.locator(`button:has-text("${nav.text}")`);
      if (await button.count() > 0) {
        await button.first().click();
        await page.waitForLoadState('networkidle');
        
        // Navigate back to dashboard for next test
        await helpers.navigateToPage('dashboard');
        await helpers.waitForDataLoad();
      }
    }
  });

  test('should verify API data integration', async ({ page }) => {
    // Verify API endpoints are being called
    await helpers.verifyAPIResponse('/api/v1/products');
    await helpers.verifyAPIResponse('/api/v1/customers');
    
    // Check that data from API is displayed correctly
    await helpers.verifyRealDataLoaded();
  });

  test('should test responsive dashboard design', async ({ page }) => {
    await helpers.testResponsiveDesign();
    
    // Verify dashboard elements are still accessible on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text*="SmartPOS"')).toBeVisible();
    await expect(page.locator('text*="Doanh thu hôm nay"')).toBeVisible();
  });

  test('should handle dashboard errors gracefully', async ({ page }) => {
    // Check for any error messages
    await helpers.checkForErrors();
    
    // Verify loading states are handled properly
    const loadingIndicators = page.locator('.loading-spinner, .skeleton, [data-testid="loading"]');
    
    // If loading indicators exist, they should eventually disappear
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators).toHaveCount(0, { timeout: 15000 });
    }
  });
});
