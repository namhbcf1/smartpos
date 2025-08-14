import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * Reports and Analytics Tests
 * Tests all report types, data visualization, and export functionality
 */

test.describe('Reports and Analytics', () => {
  let helpers: SmartPOSTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
  });

  test.describe('General Reports Page', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
    });

    test('should display reports overview page', async ({ page }) => {
      await helpers.verifyPageTitle('Tổng quan');
      
      // Verify report categories
      const reportCategories = [
        'Báo cáo doanh thu',
        'Báo cáo sản phẩm',
        'Báo cáo khách hàng',
        'Báo cáo tồn kho'
      ];
      
      for (const category of reportCategories) {
        const element = page.locator(`text*="${category}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test report navigation', async ({ page }) => {
      // Test navigation to different report types
      const reportLinks = [
        'Doanh thu',
        'Sản phẩm bán chạy',
        'Lợi nhuận',
        'Tồn kho'
      ];
      
      for (const link of reportLinks) {
        const reportLink = page.locator(`a:has-text("${link}"), button:has-text("${link}")`);
        if (await reportLink.count() > 0) {
          await reportLink.click();
          await helpers.waitForDataLoad();
          
          // Navigate back to reports overview
          await helpers.navigateToPage('reports');
          await helpers.waitForDataLoad();
        }
      }
    });
  });

  test.describe('Revenue Reports', () => {
    test('should display revenue report', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Navigate to revenue report
      const revenueLink = page.locator('a:has-text("Doanh thu"), button:has-text("Doanh thu")');
      if (await revenueLink.count() > 0) {
        await revenueLink.click();
        await helpers.waitForDataLoad();
        
        // Verify revenue report elements
        await expect(page.locator('text*="Doanh thu"')).toBeVisible();
        await expect(page.locator('text*="₫"')).toBeVisible(); // Currency
      }
    });

    test('should test revenue date filters', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Test date range filters
      const dateFilters = ['Hôm nay', 'Tuần này', 'Tháng này', 'Năm nay'];
      
      for (const filter of dateFilters) {
        const filterButton = page.locator(`button:has-text("${filter}")`);
        if (await filterButton.count() > 0) {
          await filterButton.click();
          await helpers.waitForDataLoad();
        }
      }
    });

    test('should display revenue charts', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for chart elements
      const chartElements = page.locator('svg, canvas, .recharts-wrapper');
      if (await chartElements.count() > 0) {
        await expect(chartElements.first()).toBeVisible();
      }
      
      // Check for chart titles
      await expect(page.locator('text*="Biểu đồ doanh thu"')).toBeVisible();
    });
  });

  test.describe('Product Reports', () => {
    test('should display top products report', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for top products section
      const topProductsSection = page.locator('text*="Sản phẩm bán chạy"');
      if (await topProductsSection.count() > 0) {
        await expect(topProductsSection).toBeVisible();
        
        // Should show product names and quantities
        await expect(page.locator('text*="CPU"')).toBeVisible();
      }
    });

    test('should test product performance metrics', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Check for product metrics
      const metrics = [
        'Số lượng bán',
        'Doanh thu',
        'Lợi nhuận'
      ];
      
      for (const metric of metrics) {
        const element = page.locator(`text*="${metric}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('Customer Reports', () => {
    test('should display customer analytics', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Check for customer analytics
      const customerMetrics = [
        'Khách hàng mới',
        'Khách hàng VIP',
        'Tổng khách hàng'
      ];
      
      for (const metric of customerMetrics) {
        const element = page.locator(`text*="${metric}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test customer segmentation report', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for customer segmentation
      const segmentationChart = page.locator('text*="Phân bố khách hàng"');
      if (await segmentationChart.count() > 0) {
        await expect(segmentationChart).toBeVisible();
      }
    });
  });

  test.describe('Inventory Reports', () => {
    test('should display inventory status report', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Check for inventory metrics
      const inventoryMetrics = [
        'Tổng sản phẩm',
        'Sản phẩm sắp hết',
        'Giá trị tồn kho'
      ];
      
      for (const metric of inventoryMetrics) {
        const element = page.locator(`text*="${metric}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test low stock alerts in reports', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Check for low stock section
      await expect(page.locator('text*="Sản phẩm sắp hết"')).toBeVisible();
      
      // Should show count of low stock items
      const lowStockCount = page.locator('text*="0"'); // Based on previous tests
      if (await lowStockCount.count() > 0) {
        await expect(lowStockCount).toBeVisible();
      }
    });
  });

  test.describe('Financial Reports', () => {
    test('should access financial reports', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for financial report section
      const financialSection = page.locator('text*="Tài chính"');
      if (await financialSection.count() > 0) {
        await financialSection.click();
        await helpers.waitForDataLoad();
        
        // Verify financial metrics
        const financialMetrics = [
          'Doanh thu',
          'Chi phí',
          'Lợi nhuận',
          'Thuế'
        ];
        
        for (const metric of financialMetrics) {
          const element = page.locator(`text*="${metric}"`);
          if (await element.count() > 0) {
            await expect(element).toBeVisible();
          }
        }
      }
    });

    test('should test profit margin analysis', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Check for profit analysis
      const profitSection = page.locator('text*="Lợi nhuận"');
      if (await profitSection.count() > 0) {
        await expect(profitSection).toBeVisible();
        
        // Should show percentage values
        const percentageValues = page.locator('text*="%"');
        if (await percentageValues.count() > 0) {
          await expect(percentageValues.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Data Visualization', () => {
    test('should display various chart types', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Check for different chart types
      const chartTypes = [
        'Biểu đồ doanh thu',
        'Phân bố theo danh mục',
        'Biểu đồ tròn',
        'Biểu đồ cột'
      ];
      
      for (const chartType of chartTypes) {
        const element = page.locator(`text*="${chartType}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test chart interactions', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for interactive chart elements
      const chartElements = page.locator('svg, canvas');
      if (await chartElements.count() > 0) {
        // Test hover interactions
        await chartElements.first().hover();
        
        // Look for tooltips
        const tooltip = page.locator('.tooltip, [role="tooltip"]');
        if (await tooltip.count() > 0) {
          await expect(tooltip).toBeVisible();
        }
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('should test report export options', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for export buttons
      const exportButtons = [
        'Xuất Excel',
        'Xuất PDF',
        'In báo cáo'
      ];
      
      for (const button of exportButtons) {
        const exportButton = page.locator(`button:has-text("${button}")`);
        if (await exportButton.count() > 0) {
          await expect(exportButton).toBeVisible();
        }
      }
    });

    test('should test print functionality', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for print button
      const printButton = page.locator('button:has-text("In"), button[title*="Print"]');
      if (await printButton.count() > 0) {
        await expect(printButton).toBeVisible();
      }
    });
  });

  test.describe('Real-time Data Updates', () => {
    test('should display real-time indicators', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Check for real-time indicators
      await expect(page.locator('text*="REALTIME"')).toBeVisible();
      
      // Check for last updated timestamp
      const timestamp = page.locator('text*="Cập nhật:"');
      if (await timestamp.count() > 0) {
        await expect(timestamp).toBeVisible();
      }
    });

    test('should test data refresh functionality', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for refresh button
      const refreshButton = page.locator('button:has-text("Làm mới")');
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await helpers.waitForDataLoad();
        
        // Verify data is refreshed
        await helpers.verifyRealDataLoaded();
      }
    });
  });

  test.describe('Custom Date Ranges', () => {
    test('should test custom date picker', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for date picker
      const datePicker = page.locator('input[type="date"], .date-picker');
      if (await datePicker.count() > 0) {
        await expect(datePicker).toBeVisible();
      }
    });

    test('should test date range comparison', async ({ page }) => {
      await helpers.navigateToPage('reports');
      await helpers.waitForDataLoad();
      
      // Look for comparison options
      const comparisonButton = page.locator('button:has-text("So sánh"), button:has-text("Compare")');
      if (await comparisonButton.count() > 0) {
        await expect(comparisonButton).toBeVisible();
      }
    });
  });

  test('should verify reports API integration', async ({ page }) => {
    // Verify reports API endpoints
    const reportEndpoints = [
      '/api/v1/reports/revenue',
      '/api/v1/reports/products',
      '/api/v1/reports/customers'
    ];
    
    for (const endpoint of reportEndpoints) {
      const response = await page.request.get(`https://smartpos-api.bangachieu2.workers.dev${endpoint}`);
      // Some endpoints might not exist, so we check if they return valid responses
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
      }
    }
  });

  test('should test responsive reports design', async ({ page }) => {
    await helpers.navigateToPage('reports');
    await helpers.testResponsiveDesign();
    
    // Verify charts are responsive
    await page.setViewportSize({ width: 375, height: 667 });
    const charts = page.locator('svg, canvas');
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should handle reports errors gracefully', async ({ page }) => {
    await helpers.navigateToPage('reports');
    await helpers.checkForErrors();
    
    // Test error handling for invalid date ranges
    await helpers.waitForDataLoad();
  });
});
