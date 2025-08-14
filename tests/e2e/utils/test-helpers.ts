import { Page, expect } from '@playwright/test';

/**
 * SmartPOS Test Helper Utilities
 * Common functions for E2E testing
 */

export class SmartPOSTestHelpers {
  constructor(private page: Page) {}

  /**
   * Login with admin credentials
   */
  async login(username = 'admin', password = 'admin') {
    await this.page.goto('/login');
    await this.page.waitForSelector('input[name="username"]');
    
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard');
    await this.page.waitForSelector('button[aria-label*="User"]');
  }

  /**
   * Logout from the application
   */
  async logout() {
    await this.page.click('button[aria-label*="User"]');
    await this.page.click('text=Đăng xuất');
    await this.page.waitForURL('**/login');
  }

  /**
   * Navigate to a specific page using sidebar
   */
  async navigateToPage(pageName: string) {
    const navigationMap: Record<string, string> = {
      'dashboard': 'button:has-text("Dashboard")',
      'products': 'button:has-text("Sản phẩm")',
      'categories': 'button:has-text("Danh mục")',
      'customers': 'button:has-text("Khách hàng")',
      'sales': 'button:has-text("Lịch sử bán hàng")',
      'orders': 'button:has-text("Đơn hàng")',
      'returns': 'button:has-text("Trả hàng")',
      'suppliers': 'button:has-text("Nhà cung cấp")',
      'reports': 'button:has-text("Tổng quan")',
      'settings': 'button:has-text("Cài đặt")',
      'users': 'button:has-text("Nhân viên")',
      'pos': 'button:has-text("Điểm bán hàng")',
      'inventory': 'button:has-text("Nhập kho")',
      'warranty': 'button:has-text("Bảo hành")'
    };

    const selector = navigationMap[pageName.toLowerCase()];
    if (!selector) {
      throw new Error(`Unknown page: ${pageName}`);
    }

    await this.page.click(selector);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for data to load from API
   */
  async waitForDataLoad(timeout = 10000) {
    // Wait for loading indicators to disappear
    await this.page.waitForFunction(
      () => !document.querySelector('.loading-spinner'),
      { timeout }
    );
  }

  /**
   * Verify API response contains real data
   */
  async verifyRealDataLoaded() {
    // Check for presence of real data indicators
    const hasRealData = await this.page.evaluate(() => {
      // Look for specific indicators that data is real, not mock
      const indicators = [
        document.querySelector('[data-testid="real-data-indicator"]'),
        document.querySelector('text*="D1 CLOUDFLARE"'),
        document.querySelector('text*="Dữ liệu thực tế 100%"'),
        // Check for actual product names that indicate real data
        document.querySelector('text*="CPU Intel Core i5-13400F"'),
        document.querySelector('text*="RAM Kingston Fury"'),
      ];
      return indicators.some(indicator => indicator !== null);
    });

    expect(hasRealData).toBeTruthy();
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for table data to load
   */
  async waitForTableData(tableSelector = 'table') {
    await this.page.waitForSelector(tableSelector);
    await this.page.waitForFunction(
      (selector) => {
        const table = document.querySelector(selector);
        const rows = table?.querySelectorAll('tbody tr');
        return rows && rows.length > 0;
      },
      tableSelector,
      { timeout: 15000 }
    );
  }

  /**
   * Verify page title and heading
   */
  async verifyPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(/SmartPOS/);
    const heading = this.page.locator('h1').first();
    await expect(heading).toContainText(expectedTitle);
  }

  /**
   * Check for error messages
   */
  async checkForErrors() {
    const errorSelectors = [
      '[role="alert"]',
      '.error-message',
      '.alert-error',
      'text*="Error"',
      'text*="Lỗi"'
    ];

    for (const selector of errorSelectors) {
      const errorElement = this.page.locator(selector);
      if (await errorElement.count() > 0) {
        const errorText = await errorElement.textContent();
        console.warn(`Warning: Error message found: ${errorText}`);
      }
    }
  }

  /**
   * Verify responsive design
   */
  async testResponsiveDesign() {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(1000); // Allow layout to adjust
      
      // Verify navigation is accessible
      const navElement = this.page.locator('nav').first();
      await expect(navElement).toBeVisible();
      
      await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
    }
  }

  /**
   * Test search functionality
   */
  async testSearch(searchTerm: string, expectedResults?: string[]) {
    const searchInput = this.page.locator('input[placeholder*="Tìm kiếm"], input[placeholder*="Search"]');
    await searchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    
    await this.waitForDataLoad();
    
    if (expectedResults) {
      for (const result of expectedResults) {
        await expect(this.page.locator(`text*="${result}"`)).toBeVisible();
      }
    }
  }

  /**
   * Verify API endpoint response
   */
  async verifyAPIResponse(endpoint: string, expectedStatus = 200) {
    const response = await this.page.request.get(`https://smartpos-api.bangachieu2.workers.dev${endpoint}`);
    expect(response.status()).toBe(expectedStatus);
    
    if (expectedStatus === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
    }
    
    return response;
  }
}
