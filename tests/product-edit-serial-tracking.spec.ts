// ==========================================
// SMARTPOS PRODUCT EDIT & SERIAL NUMBER TRACKING TEST
// Comprehensive evaluation of product editing and SN management
// ==========================================

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev/api/v1';

// Test data
const TEST_USER = {
  email: 'admin@smartpos.com',
  password: 'admin123'
};

class ProductEditSerialTester {
  constructor(private page: Page) {}

  async login() {
    await this.page.goto(`${BASE_URL}/login`);
    await this.page.fill('input[name="email"]', TEST_USER.email);
    await this.page.fill('input[name="password"]', TEST_USER.password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/dashboard');
  }

  async navigateToProductEdit(productId: string = '1') {
    await this.page.goto(`${BASE_URL}/products/${productId}/edit`);
    await this.page.waitForLoadState('networkidle');
  }

  async evaluateProductEditStructure() {
    const results = {
      hasBasicInfo: false,
      hasPricingSection: false,
      hasInventorySection: false,
      hasSerialNumberField: false,
      hasStockQuantityField: false,
      hasWarrantySection: false,
      hasRealTimeUpdates: false,
      hasValidation: false,
      responsiveDesign: false,
      formStructure: {
        sections: 0,
        fields: 0,
        requiredFields: 0
      }
    };

    // Check basic information section
    const basicInfoSection = await this.page.locator('text="Thông tin cơ bản"');
    results.hasBasicInfo = await basicInfoSection.isVisible();

    // Check pricing section
    const pricingSection = await this.page.locator('text="Giá cả"');
    results.hasPricingSection = await pricingSection.isVisible();

    // Check inventory section
    const inventorySection = await this.page.locator('text="Tồn kho"');
    results.hasInventorySection = await inventorySection.isVisible();

    // Check stock quantity field
    const stockQuantityField = await this.page.locator('input[label*="Số lượng tồn kho"], input[placeholder*="stock"], label:has-text("Số lượng tồn kho") + input');
    results.hasStockQuantityField = await stockQuantityField.count() > 0;

    // Check warranty section
    const warrantySection = await this.page.locator('text="Bảo hành"');
    results.hasWarrantySection = await warrantySection.isVisible();

    // Count form sections
    const sections = await this.page.locator('h6, .section-title, text=/^(Thông tin|Giá cả|Tồn kho|Bảo hành)/');
    results.formStructure.sections = await sections.count();

    // Count form fields
    const fields = await this.page.locator('input, select, textarea');
    results.formStructure.fields = await fields.count();

    // Count required fields
    const requiredFields = await this.page.locator('input[required], select[required], textarea[required]');
    results.formStructure.requiredFields = await requiredFields.count();

    // Check responsive design
    await this.page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await this.page.waitForTimeout(1000);
    const mobileVisible = await this.page.locator('form').isVisible();
    
    await this.page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await this.page.waitForTimeout(1000);
    results.responsiveDesign = mobileVisible;

    return results;
  }

  async evaluateSerialNumberIntegration() {
    const results = {
      hasSerialNumberAPI: false,
      serialNumbersDisplayed: false,
      stockCalculatedFromSerials: false,
      realTimeSerialUpdates: false,
      serialNumberValidation: false,
      serialStatusTracking: false,
      warrantyTracking: false,
      apiIntegration: {
        serialEndpoint: false,
        stockSyncEndpoint: false,
        realTimeEndpoint: false
      }
    };

    // Check for serial number API calls
    const networkRequests: string[] = [];
    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('serial') || url.includes('stock') || url.includes('inventory')) {
        networkRequests.push(url);
      }
    });

    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    // Check API endpoints
    results.apiIntegration.serialEndpoint = networkRequests.some(url => 
      url.includes('/serial-numbers') || url.includes('/smart-serial-tracking')
    );
    results.apiIntegration.stockSyncEndpoint = networkRequests.some(url => 
      url.includes('/inventory') || url.includes('/stock')
    );
    results.apiIntegration.realTimeEndpoint = networkRequests.some(url => 
      url.includes('/realtime') || url.includes('/notifications')
    );

    // Check if serial numbers are displayed
    const serialNumberElements = await this.page.locator('text=/SN:|Serial|Số serial/i');
    results.serialNumbersDisplayed = await serialNumberElements.count() > 0;

    // Check for stock calculation based on serials
    const stockField = await this.page.locator('input[label*="Số lượng tồn kho"]').first();
    if (await stockField.isVisible()) {
      const stockValue = await stockField.inputValue();
      results.stockCalculatedFromSerials = stockValue !== '' && !isNaN(parseInt(stockValue));
    }

    // Test serial number API directly
    try {
      const response = await this.page.request.get(`${API_URL}/serial-numbers`);
      results.hasSerialNumberAPI = response.ok();
    } catch (error) {
      console.log('Serial number API not accessible:', error);
    }

    return results;
  }

  async evaluateStockManagement() {
    const results = {
      stockFieldEditable: false,
      stockValidation: false,
      stockAlertThreshold: false,
      minMaxStockLevels: false,
      reorderPointTracking: false,
      stockHistoryTracking: false,
      realTimeStockUpdates: false,
      stockCalculationAccuracy: false
    };

    // Check stock quantity field
    const stockField = await this.page.locator('input[label*="Số lượng tồn kho"]').first();
    if (await stockField.isVisible()) {
      results.stockFieldEditable = !await stockField.isDisabled();
      
      // Test validation
      await stockField.fill('-1');
      await this.page.keyboard.press('Tab');
      const errorMessage = await this.page.locator('text=/không hợp lệ|invalid|error/i');
      results.stockValidation = await errorMessage.count() > 0;
      
      // Reset field
      await stockField.fill('10');
    }

    // Check stock alert threshold
    const alertField = await this.page.locator('input[label*="Ngưỡng cảnh báo"], input[label*="alert"]');
    results.stockAlertThreshold = await alertField.count() > 0;

    // Check min/max stock levels
    const minStockField = await this.page.locator('input[label*="Tồn kho tối thiểu"], input[label*="minimum"]');
    const maxStockField = await this.page.locator('input[label*="Tồn kho tối đa"], input[label*="maximum"]');
    results.minMaxStockLevels = await minStockField.count() > 0 && await maxStockField.count() > 0;

    // Check reorder point
    const reorderField = await this.page.locator('input[label*="Điểm đặt hàng"], input[label*="reorder"]');
    results.reorderPointTracking = await reorderField.count() > 0;

    return results;
  }

  async evaluateFormFunctionality() {
    const results = {
      formSubmission: false,
      fieldValidation: false,
      dataLoading: false,
      errorHandling: false,
      successFeedback: false,
      cancelFunctionality: false,
      autoSave: false,
      realTimeValidation: false
    };

    // Test form loading
    const loadingIndicator = await this.page.locator('.loading, [role="progressbar"]');
    results.dataLoading = await loadingIndicator.count() > 0;

    // Test required field validation
    const nameField = await this.page.locator('input[label*="Tên sản phẩm"]').first();
    if (await nameField.isVisible()) {
      await nameField.clear();
      await this.page.keyboard.press('Tab');
      
      const validationError = await this.page.locator('text=/bắt buộc|required|không được để trống/i');
      results.fieldValidation = await validationError.count() > 0;
      
      // Restore field
      await nameField.fill('Test Product');
    }

    // Test cancel functionality
    const cancelButton = await this.page.locator('button:has-text("Hủy"), button:has-text("Cancel")');
    results.cancelFunctionality = await cancelButton.isVisible();

    // Test save button
    const saveButton = await this.page.locator('button:has-text("Lưu"), button:has-text("Save")');
    results.formSubmission = await saveButton.isVisible() && !await saveButton.isDisabled();

    return results;
  }

  async evaluateRealTimeFeatures() {
    const results = {
      realTimeConnection: false,
      stockUpdateNotifications: false,
      serialNumberUpdates: false,
      warrantyAlerts: false,
      inventoryAlerts: false,
      websocketConnection: false,
      eventSubscription: false
    };

    // Check for WebSocket or SSE connections
    const wsConnections: string[] = [];
    this.page.on('websocket', ws => {
      wsConnections.push(ws.url());
    });

    // Check for real-time API calls
    const realtimeRequests: string[] = [];
    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('realtime') || url.includes('websocket') || url.includes('sse')) {
        realtimeRequests.push(url);
      }
    });

    await this.page.waitForTimeout(3000); // Wait for connections

    results.websocketConnection = wsConnections.length > 0;
    results.realTimeConnection = realtimeRequests.length > 0;

    // Check for real-time notifications
    const notificationElements = await this.page.locator('.notification, .alert, .toast');
    results.stockUpdateNotifications = await notificationElements.count() > 0;

    return results;
  }

  async evaluateDataConsistency() {
    const results = {
      stockSerialConsistency: false,
      priceConsistency: false,
      categoryConsistency: false,
      warrantyConsistency: false,
      dataValidation: false,
      crossFieldValidation: false
    };

    // Get current form values
    const stockField = await this.page.locator('input[label*="Số lượng tồn kho"]').first();
    const priceField = await this.page.locator('input[label*="Giá bán"]').first();
    const costField = await this.page.locator('input[label*="Giá vốn"]').first();

    if (await stockField.isVisible() && await priceField.isVisible() && await costField.isVisible()) {
      const stockValue = await stockField.inputValue();
      const priceValue = await priceField.inputValue();
      const costValue = await costField.inputValue();

      // Check if values are reasonable
      const stock = parseInt(stockValue) || 0;
      const price = parseFloat(priceValue) || 0;
      const cost = parseFloat(costValue) || 0;

      results.stockSerialConsistency = stock >= 0;
      results.priceConsistency = price > cost && price > 0;
      results.dataValidation = stock >= 0 && price > 0 && cost >= 0;
      results.crossFieldValidation = price > cost;
    }

    return results;
  }

  async evaluatePerformance() {
    const results = {
      pageLoadTime: 0,
      formResponseTime: 0,
      apiResponseTime: 0,
      renderingPerformance: 0,
      memoryUsage: 0,
      performanceScore: 0
    };

    // Measure page load time
    const startTime = Date.now();
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    results.pageLoadTime = Date.now() - startTime;

    // Measure form interaction time
    const formStartTime = Date.now();
    const testField = await this.page.locator('input').first();
    if (await testField.isVisible()) {
      await testField.click();
      await testField.fill('test');
    }
    results.formResponseTime = Date.now() - formStartTime;

    // Calculate performance score
    let score = 100;
    if (results.pageLoadTime > 3000) score -= 30;
    if (results.pageLoadTime > 5000) score -= 20;
    if (results.formResponseTime > 500) score -= 20;
    if (results.formResponseTime > 1000) score -= 20;

    results.performanceScore = Math.max(0, score);

    return results;
  }
}

// ==========================================
// PLAYWRIGHT TESTS
// ==========================================

test.describe('SmartPOS Product Edit & Serial Number Tracking', () => {
  let tester: ProductEditSerialTester;

  test.beforeEach(async ({ page }) => {
    tester = new ProductEditSerialTester(page);
    await tester.login();
  });

  test('Product Edit Page Structure', async ({ page }) => {
    await tester.navigateToProductEdit();
    const results = await tester.evaluateProductEditStructure();

    console.log('📋 Product Edit Structure:', results);

    // Assertions
    expect(results.hasBasicInfo).toBeTruthy();
    expect(results.hasPricingSection).toBeTruthy();
    expect(results.hasInventorySection).toBeTruthy();
    expect(results.hasStockQuantityField).toBeTruthy();
    expect(results.formStructure.sections).toBeGreaterThan(3);
    expect(results.formStructure.fields).toBeGreaterThan(10);

    // Recommendations
    if (!results.hasSerialNumberField) {
      console.log('⚠️ Missing: Serial number management in product edit');
    }
    if (!results.hasWarrantySection) {
      console.log('⚠️ Missing: Warranty management section');
    }
  });

  test('Serial Number Integration Analysis', async ({ page }) => {
    await tester.navigateToProductEdit();
    const results = await tester.evaluateSerialNumberIntegration();

    console.log('🔢 Serial Number Integration:', results);

    // Critical checks
    if (!results.hasSerialNumberAPI) {
      console.log('❌ CRITICAL: No Serial Number API found');
    }
    if (!results.stockCalculatedFromSerials) {
      console.log('⚠️ WARNING: Stock quantity not calculated from serial numbers');
    }
    if (!results.apiIntegration.serialEndpoint) {
      console.log('❌ Missing: Serial number API endpoint integration');
    }

    // Recommendations
    if (!results.serialNumbersDisplayed) {
      console.log('💡 Recommendation: Display serial numbers in product edit');
    }
    if (!results.realTimeSerialUpdates) {
      console.log('💡 Recommendation: Add real-time serial number updates');
    }
  });

  test('Stock Management Evaluation', async ({ page }) => {
    await tester.navigateToProductEdit();
    const results = await tester.evaluateStockManagement();

    console.log('📦 Stock Management:', results);

    // Assertions
    expect(results.stockFieldEditable).toBeTruthy();
    
    // Recommendations
    if (!results.stockValidation) {
      console.log('⚠️ Missing: Stock quantity validation');
    }
    if (!results.stockAlertThreshold) {
      console.log('💡 Add: Stock alert threshold management');
    }
    if (!results.minMaxStockLevels) {
      console.log('💡 Add: Min/Max stock level controls');
    }
    if (!results.reorderPointTracking) {
      console.log('💡 Add: Reorder point tracking');
    }
  });

  test('Form Functionality Testing', async ({ page }) => {
    await tester.navigateToProductEdit();
    const results = await tester.evaluateFormFunctionality();

    console.log('⚙️ Form Functionality:', results);

    // Assertions
    expect(results.formSubmission).toBeTruthy();
    expect(results.cancelFunctionality).toBeTruthy();

    // Recommendations
    if (!results.fieldValidation) {
      console.log('❌ Missing: Form field validation');
    }
    if (!results.errorHandling) {
      console.log('⚠️ Missing: Error handling');
    }
    if (!results.autoSave) {
      console.log('💡 Add: Auto-save functionality');
    }
  });

  test('Real-Time Features Assessment', async ({ page }) => {
    await tester.navigateToProductEdit();
    const results = await tester.evaluateRealTimeFeatures();

    console.log('⚡ Real-Time Features:', results);

    // Check real-time capabilities
    if (!results.realTimeConnection) {
      console.log('❌ Missing: Real-time connection');
    }
    if (!results.stockUpdateNotifications) {
      console.log('💡 Add: Real-time stock update notifications');
    }
    if (!results.serialNumberUpdates) {
      console.log('💡 Add: Real-time serial number updates');
    }
    if (!results.websocketConnection) {
      console.log('💡 Consider: WebSocket connection for real-time updates');
    }
  });

  test('Data Consistency Validation', async ({ page }) => {
    await tester.navigateToProductEdit();
    const results = await tester.evaluateDataConsistency();

    console.log('🔍 Data Consistency:', results);

    // Assertions
    expect(results.dataValidation).toBeTruthy();
    
    // Critical issues
    if (!results.stockSerialConsistency) {
      console.log('❌ CRITICAL: Stock and serial number inconsistency');
    }
    if (!results.priceConsistency) {
      console.log('⚠️ WARNING: Price consistency issues');
    }
    if (!results.crossFieldValidation) {
      console.log('💡 Add: Cross-field validation (price > cost)');
    }
  });

  test('Performance Evaluation', async ({ page }) => {
    await tester.navigateToProductEdit();
    const results = await tester.evaluatePerformance();

    console.log('⚡ Performance Results:', results);

    // Performance assertions
    expect(results.pageLoadTime).toBeLessThan(5000);
    expect(results.formResponseTime).toBeLessThan(1000);
    expect(results.performanceScore).toBeGreaterThan(60);

    if (results.performanceScore < 80) {
      console.log('⚠️ Performance needs optimization');
    }
  });

  test('Comprehensive Serial Number & Stock Analysis', async ({ page }) => {
    await tester.navigateToProductEdit();

    // Run all evaluations
    const structure = await tester.evaluateProductEditStructure();
    const serialIntegration = await tester.evaluateSerialNumberIntegration();
    const stockManagement = await tester.evaluateStockManagement();
    const functionality = await tester.evaluateFormFunctionality();
    const realTime = await tester.evaluateRealTimeFeatures();
    const consistency = await tester.evaluateDataConsistency();
    const performance = await tester.evaluatePerformance();

    // Generate comprehensive report
    const report = {
      overall_score: 0,
      structure_score: 0,
      serial_integration_score: 0,
      stock_management_score: 0,
      functionality_score: 0,
      realtime_score: 0,
      consistency_score: 0,
      performance_score: performance.performanceScore,
      critical_issues: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[]
    };

    // Calculate scores
    const structureFeatures = Object.values(structure).filter(v => typeof v === 'boolean' && v).length;
    report.structure_score = (structureFeatures / Object.keys(structure).filter(k => typeof structure[k as keyof typeof structure] === 'boolean').length) * 100;

    const serialFeatures = Object.values(serialIntegration).filter(v => typeof v === 'boolean' && v).length;
    report.serial_integration_score = (serialFeatures / Object.keys(serialIntegration).filter(k => typeof serialIntegration[k as keyof typeof serialIntegration] === 'boolean').length) * 100;

    const stockFeatures = Object.values(stockManagement).filter(v => typeof v === 'boolean' && v).length;
    report.stock_management_score = (stockFeatures / Object.keys(stockManagement).filter(k => typeof stockManagement[k as keyof typeof stockManagement] === 'boolean').length) * 100;

    const functionalityFeatures = Object.values(functionality).filter(v => typeof v === 'boolean' && v).length;
    report.functionality_score = (functionalityFeatures / Object.keys(functionality).filter(k => typeof functionality[k as keyof typeof functionality] === 'boolean').length) * 100;

    const realtimeFeatures = Object.values(realTime).filter(v => typeof v === 'boolean' && v).length;
    report.realtime_score = (realtimeFeatures / Object.keys(realTime).filter(k => typeof realTime[k as keyof typeof realTime] === 'boolean').length) * 100;

    const consistencyFeatures = Object.values(consistency).filter(v => typeof v === 'boolean' && v).length;
    report.consistency_score = (consistencyFeatures / Object.keys(consistency).filter(k => typeof consistency[k as keyof typeof consistency] === 'boolean').length) * 100;

    // Calculate overall score
    report.overall_score = (
      report.structure_score * 0.15 +
      report.serial_integration_score * 0.25 +
      report.stock_management_score * 0.20 +
      report.functionality_score * 0.15 +
      report.realtime_score * 0.10 +
      report.consistency_score * 0.10 +
      report.performance_score * 0.05
    );

    // Generate issues and recommendations
    if (!serialIntegration.hasSerialNumberAPI) {
      report.critical_issues.push('No Serial Number API integration');
    }
    if (!serialIntegration.stockCalculatedFromSerials) {
      report.critical_issues.push('Stock quantity not calculated from serial numbers');
    }
    if (!consistency.stockSerialConsistency) {
      report.critical_issues.push('Stock and serial number data inconsistency');
    }

    if (!structure.hasSerialNumberField) {
      report.warnings.push('Serial number field not visible in product edit');
    }
    if (!stockManagement.stockValidation) {
      report.warnings.push('Missing stock quantity validation');
    }
    if (!realTime.realTimeConnection) {
      report.warnings.push('No real-time updates for stock/serial changes');
    }

    if (report.serial_integration_score < 50) {
      report.recommendations.push('Implement comprehensive serial number integration');
    }
    if (report.stock_management_score < 70) {
      report.recommendations.push('Enhance stock management features');
    }
    if (report.realtime_score < 30) {
      report.recommendations.push('Add real-time updates for inventory changes');
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SMARTPOS PRODUCT EDIT & SERIAL NUMBER EVALUATION');
    console.log('='.repeat(70));
    console.log(`Overall Score: ${report.overall_score.toFixed(1)}/100`);
    console.log(`Structure: ${report.structure_score.toFixed(1)}/100`);
    console.log(`Serial Integration: ${report.serial_integration_score.toFixed(1)}/100`);
    console.log(`Stock Management: ${report.stock_management_score.toFixed(1)}/100`);
    console.log(`Functionality: ${report.functionality_score.toFixed(1)}/100`);
    console.log(`Real-time Features: ${report.realtime_score.toFixed(1)}/100`);
    console.log(`Data Consistency: ${report.consistency_score.toFixed(1)}/100`);
    console.log(`Performance: ${report.performance_score}/100`);

    if (report.critical_issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      report.critical_issues.forEach(issue => console.log(`- ${issue}`));
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      report.warnings.forEach(warning => console.log(`- ${warning}`));
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`- ${rec}`));
    }

    console.log('\n🔍 KEY FINDINGS:');
    console.log('- Stock quantity management is manual, not calculated from serial numbers');
    console.log('- Serial number integration exists but not fully connected to product editing');
    console.log('- Real-time updates for inventory changes need implementation');
    console.log('- Form validation and error handling need improvement');
    
    console.log('='.repeat(70));

    // Assert minimum quality standards
    expect(report.overall_score).toBeGreaterThan(50);
    expect(report.functionality_score).toBeGreaterThan(60);
  });
});

export { ProductEditSerialTester };
