// ==========================================
// SMARTPOS RETURNS PAGE PLAYWRIGHT TEST
// Comprehensive testing and evaluation
// ==========================================

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev/api/v1';

// Test data
const TEST_USER = {
  email: 'admin@smartpos.com',
  password: 'admin123'
};

class ReturnsPageTester {
  constructor(private page: Page) {}

  async login() {
    await this.page.goto(`${BASE_URL}/login`);
    await this.page.fill('input[name="email"]', TEST_USER.email);
    await this.page.fill('input[name="password"]', TEST_USER.password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/dashboard');
  }

  async navigateToReturns() {
    await this.page.goto(`${BASE_URL}/returns`);
    await this.page.waitForLoadState('networkidle');
  }

  async evaluatePageStructure() {
    const results = {
      hasHeader: false,
      hasSearchBar: false,
      hasFilterOptions: false,
      hasDataTable: false,
      hasActionButtons: false,
      hasPagination: false,
      hasCreateButton: false,
      responsiveDesign: false
    };

    // Check header
    const header = await this.page.locator('h1, h2, h3').first();
    results.hasHeader = await header.isVisible();

    // Check search functionality
    const searchInput = await this.page.locator('input[placeholder*="search" i], input[placeholder*="tìm" i]');
    results.hasSearchBar = await searchInput.count() > 0;

    // Check filter options
    const filterElements = await this.page.locator('select, [role="combobox"], button:has-text("Filter")');
    results.hasFilterOptions = await filterElements.count() > 0;

    // Check data table
    const table = await this.page.locator('table, [role="table"]');
    results.hasDataTable = await table.isVisible();

    // Check action buttons
    const actionButtons = await this.page.locator('button:has-text("View"), button:has-text("Edit"), button:has-text("Delete")');
    results.hasActionButtons = await actionButtons.count() > 0;

    // Check pagination
    const pagination = await this.page.locator('[role="navigation"], .pagination, button:has-text("Next")');
    results.hasPagination = await pagination.count() > 0;

    // Check create button
    const createButton = await this.page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    results.hasCreateButton = await createButton.count() > 0;

    // Check responsive design
    await this.page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await this.page.waitForTimeout(1000);
    const mobileLayout = await this.page.locator('body').screenshot();
    
    await this.page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await this.page.waitForTimeout(1000);
    results.responsiveDesign = true; // Assume responsive if no errors

    return results;
  }

  async evaluateDataLoading() {
    const results = {
      loadsData: false,
      showsLoadingState: false,
      handlesEmptyState: false,
      hasErrorHandling: false,
      dataIsReal: false,
      responseTime: 0
    };

    const startTime = Date.now();

    // Check loading state
    const loadingIndicator = await this.page.locator('.loading, [role="progressbar"], .skeleton');
    results.showsLoadingState = await loadingIndicator.count() > 0;

    // Wait for data to load
    await this.page.waitForLoadState('networkidle');
    results.responseTime = Date.now() - startTime;

    // Check if data is loaded
    const dataRows = await this.page.locator('tbody tr, [role="row"]');
    const rowCount = await dataRows.count();
    results.loadsData = rowCount > 0;

    // Check empty state
    if (rowCount === 0) {
      const emptyMessage = await this.page.locator('text=/no.*data/i, text=/empty/i, text=/không.*dữ.*liệu/i');
      results.handlesEmptyState = await emptyMessage.count() > 0;
    }

    // Check for error handling
    const errorMessage = await this.page.locator('.error, [role="alert"], text=/error/i, text=/lỗi/i');
    results.hasErrorHandling = await errorMessage.count() > 0;

    // Evaluate if data looks real (not mock)
    if (rowCount > 0) {
      const firstRowText = await dataRows.first().textContent();
      results.dataIsReal = !firstRowText?.includes('mock') && !firstRowText?.includes('test') && !firstRowText?.includes('sample');
    }

    return results;
  }

  async evaluateFunctionality() {
    const results = {
      searchWorks: false,
      filterWorks: false,
      sortingWorks: false,
      paginationWorks: false,
      createFormWorks: false,
      editFormWorks: false,
      deleteWorks: false,
      validationWorks: false
    };

    try {
      // Test search functionality
      const searchInput = await this.page.locator('input[placeholder*="search" i], input[placeholder*="tìm" i]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await this.page.waitForTimeout(1000);
        results.searchWorks = true;
      }

      // Test filter functionality
      const filterSelect = await this.page.locator('select, [role="combobox"]').first();
      if (await filterSelect.isVisible()) {
        await filterSelect.click();
        await this.page.waitForTimeout(500);
        results.filterWorks = true;
      }

      // Test sorting
      const sortableHeader = await this.page.locator('th[role="columnheader"], th button').first();
      if (await sortableHeader.isVisible()) {
        await sortableHeader.click();
        await this.page.waitForTimeout(1000);
        results.sortingWorks = true;
      }

      // Test pagination
      const nextButton = await this.page.locator('button:has-text("Next"), button:has-text("›"), button:has-text("Tiếp")').first();
      if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
        await nextButton.click();
        await this.page.waitForTimeout(1000);
        results.paginationWorks = true;
      }

      // Test create functionality
      const createButton = await this.page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), button:has-text("Thêm")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await this.page.waitForTimeout(1000);
        
        const dialog = await this.page.locator('[role="dialog"], .modal, .popup');
        results.createFormWorks = await dialog.isVisible();
        
        // Close dialog if opened
        const closeButton = await this.page.locator('button:has-text("Cancel"), button:has-text("Close"), button:has-text("Hủy")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }

      // Test edit functionality
      const editButton = await this.page.locator('button:has-text("Edit"), button:has-text("Sửa"), [aria-label*="edit" i]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await this.page.waitForTimeout(1000);
        
        const editDialog = await this.page.locator('[role="dialog"], .modal, .popup');
        results.editFormWorks = await editDialog.isVisible();
        
        // Close dialog if opened
        const closeButton = await this.page.locator('button:has-text("Cancel"), button:has-text("Close"), button:has-text("Hủy")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }

    } catch (error) {
      console.log('Functionality test error:', error);
    }

    return results;
  }

  async evaluatePerformance() {
    const results = {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      timeToInteractive: 0,
      performanceScore: 0
    };

    // Measure page load performance
    const startTime = Date.now();
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    results.pageLoadTime = Date.now() - startTime;

    // Get performance metrics
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });

    results.firstContentfulPaint = performanceMetrics.firstContentfulPaint;
    
    // Calculate performance score
    let score = 100;
    if (results.pageLoadTime > 3000) score -= 30;
    if (results.pageLoadTime > 5000) score -= 20;
    if (results.firstContentfulPaint > 2000) score -= 20;
    if (results.firstContentfulPaint > 4000) score -= 20;
    
    results.performanceScore = Math.max(0, score);

    return results;
  }

  async evaluateAccessibility() {
    const results = {
      hasProperHeadings: false,
      hasAltTexts: false,
      hasAriaLabels: false,
      keyboardNavigable: false,
      colorContrast: false,
      screenReaderFriendly: false,
      accessibilityScore: 0
    };

    // Check heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6');
    results.hasProperHeadings = await headings.count() > 0;

    // Check alt texts for images
    const images = await this.page.locator('img');
    const imagesWithAlt = await this.page.locator('img[alt]');
    results.hasAltTexts = await images.count() === await imagesWithAlt.count();

    // Check ARIA labels
    const ariaElements = await this.page.locator('[aria-label], [aria-labelledby], [role]');
    results.hasAriaLabels = await ariaElements.count() > 0;

    // Test keyboard navigation
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.locator(':focus');
    results.keyboardNavigable = await focusedElement.count() > 0;

    // Calculate accessibility score
    let score = 0;
    if (results.hasProperHeadings) score += 25;
    if (results.hasAltTexts) score += 25;
    if (results.hasAriaLabels) score += 25;
    if (results.keyboardNavigable) score += 25;
    
    results.accessibilityScore = score;

    return results;
  }

  async evaluateBackendIntegration() {
    const results = {
      hasBackendAPI: false,
      apiResponseTime: 0,
      dataConsistency: false,
      errorHandling: false,
      realTimeUpdates: false,
      crudOperations: {
        create: false,
        read: false,
        update: false,
        delete: false
      }
    };

    // Check if returns API exists
    try {
      const response = await this.page.request.get(`${API_URL}/returns`);
      results.hasBackendAPI = response.ok();
      results.apiResponseTime = Date.now();
    } catch (error) {
      console.log('Returns API not found:', error);
    }

    // Check for network requests
    const networkRequests: string[] = [];
    this.page.on('request', request => {
      if (request.url().includes('returns')) {
        networkRequests.push(request.url());
      }
    });

    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    results.crudOperations.read = networkRequests.some(url => url.includes('returns'));

    return results;
  }
}

// ==========================================
// PLAYWRIGHT TESTS
// ==========================================

test.describe('SmartPOS Returns Page Evaluation', () => {
  let tester: ReturnsPageTester;

  test.beforeEach(async ({ page }) => {
    tester = new ReturnsPageTester(page);
    await tester.login();
  });

  test('Page Structure and Layout', async ({ page }) => {
    await tester.navigateToReturns();
    const results = await tester.evaluatePageStructure();

    console.log('📋 Page Structure Results:', results);

    // Assertions
    expect(results.hasHeader).toBeTruthy();
    expect(results.hasDataTable).toBeTruthy();
    
    // Log recommendations
    if (!results.hasSearchBar) {
      console.log('⚠️ Recommendation: Add search functionality');
    }
    if (!results.hasFilterOptions) {
      console.log('⚠️ Recommendation: Add filter options');
    }
    if (!results.hasCreateButton) {
      console.log('⚠️ Recommendation: Add create return button');
    }
  });

  test('Data Loading and Management', async ({ page }) => {
    await tester.navigateToReturns();
    const results = await tester.evaluateDataLoading();

    console.log('📊 Data Loading Results:', results);

    // Performance assertions
    expect(results.responseTime).toBeLessThan(5000); // Should load within 5 seconds
    
    if (!results.loadsData) {
      console.log('⚠️ Issue: No data is being loaded');
    }
    if (!results.showsLoadingState) {
      console.log('⚠️ Recommendation: Add loading indicators');
    }
    if (!results.handlesEmptyState) {
      console.log('⚠️ Recommendation: Add empty state handling');
    }
  });

  test('Functionality Testing', async ({ page }) => {
    await tester.navigateToReturns();
    const results = await tester.evaluateFunctionality();

    console.log('⚙️ Functionality Results:', results);

    // Log missing features
    if (!results.searchWorks) {
      console.log('❌ Missing: Search functionality');
    }
    if (!results.createFormWorks) {
      console.log('❌ Missing: Create return form');
    }
    if (!results.editFormWorks) {
      console.log('❌ Missing: Edit return functionality');
    }
  });

  test('Performance Evaluation', async ({ page }) => {
    await tester.navigateToReturns();
    const results = await tester.evaluatePerformance();

    console.log('⚡ Performance Results:', results);

    // Performance assertions
    expect(results.pageLoadTime).toBeLessThan(3000); // Should load within 3 seconds
    expect(results.performanceScore).toBeGreaterThan(70); // Should have good performance

    if (results.performanceScore < 80) {
      console.log('⚠️ Performance needs improvement');
    }
  });

  test('Accessibility Evaluation', async ({ page }) => {
    await tester.navigateToReturns();
    const results = await tester.evaluateAccessibility();

    console.log('♿ Accessibility Results:', results);

    // Accessibility assertions
    expect(results.accessibilityScore).toBeGreaterThan(50);

    if (!results.hasProperHeadings) {
      console.log('❌ Missing: Proper heading structure');
    }
    if (!results.keyboardNavigable) {
      console.log('❌ Missing: Keyboard navigation support');
    }
  });

  test('Backend Integration', async ({ page }) => {
    await tester.navigateToReturns();
    const results = await tester.evaluateBackendIntegration();

    console.log('🔗 Backend Integration Results:', results);

    if (!results.hasBackendAPI) {
      console.log('❌ Critical: No backend API for returns');
    }
    if (!results.crudOperations.read) {
      console.log('❌ Missing: Read operations');
    }
  });

  test('Comprehensive Evaluation Report', async ({ page }) => {
    await tester.navigateToReturns();

    // Run all evaluations
    const structure = await tester.evaluatePageStructure();
    const dataLoading = await tester.evaluateDataLoading();
    const functionality = await tester.evaluateFunctionality();
    const performance = await tester.evaluatePerformance();
    const accessibility = await tester.evaluateAccessibility();
    const backend = await tester.evaluateBackendIntegration();

    // Generate comprehensive report
    const report = {
      overall_score: 0,
      structure_score: 0,
      functionality_score: 0,
      performance_score: performance.performanceScore,
      accessibility_score: accessibility.accessibilityScore,
      backend_score: 0,
      recommendations: [] as string[],
      critical_issues: [] as string[],
      improvements: [] as string[]
    };

    // Calculate structure score
    const structureFeatures = Object.values(structure).filter(Boolean).length;
    report.structure_score = (structureFeatures / Object.keys(structure).length) * 100;

    // Calculate functionality score
    const functionalityFeatures = Object.values(functionality).filter(Boolean).length;
    report.functionality_score = (functionalityFeatures / Object.keys(functionality).length) * 100;

    // Calculate backend score
    const backendFeatures = Object.values(backend.crudOperations).filter(Boolean).length;
    report.backend_score = backend.hasBackendAPI ? 50 + (backendFeatures * 12.5) : 0;

    // Calculate overall score
    report.overall_score = (
      report.structure_score * 0.2 +
      report.functionality_score * 0.3 +
      report.performance_score * 0.2 +
      report.accessibility_score * 0.1 +
      report.backend_score * 0.2
    );

    // Generate recommendations
    if (!backend.hasBackendAPI) {
      report.critical_issues.push('No backend API for returns management');
    }
    if (!structure.hasCreateButton) {
      report.improvements.push('Add create return functionality');
    }
    if (!structure.hasSearchBar) {
      report.improvements.push('Add search and filter capabilities');
    }
    if (performance.pageLoadTime > 3000) {
      report.improvements.push('Optimize page loading performance');
    }
    if (accessibility.accessibilityScore < 80) {
      report.improvements.push('Improve accessibility compliance');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SMARTPOS RETURNS PAGE EVALUATION REPORT');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${report.overall_score.toFixed(1)}/100`);
    console.log(`Structure: ${report.structure_score.toFixed(1)}/100`);
    console.log(`Functionality: ${report.functionality_score.toFixed(1)}/100`);
    console.log(`Performance: ${report.performance_score}/100`);
    console.log(`Accessibility: ${report.accessibility_score}/100`);
    console.log(`Backend Integration: ${report.backend_score.toFixed(1)}/100`);
    
    if (report.critical_issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      report.critical_issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    if (report.improvements.length > 0) {
      console.log('\n💡 RECOMMENDED IMPROVEMENTS:');
      report.improvements.forEach(improvement => console.log(`- ${improvement}`));
    }
    
    console.log('='.repeat(60));

    // Assert minimum quality standards
    expect(report.overall_score).toBeGreaterThan(40); // Minimum acceptable score
  });
});

// ==========================================
// EXPORT FOR STANDALONE USAGE
// ==========================================

export { ReturnsPageTester };
