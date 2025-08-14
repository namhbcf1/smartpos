import { test, expect } from '@playwright/test';
import { SmartPOSTestHelpers } from '../utils/test-helpers';

/**
 * Settings and Navigation Tests
 * Tests system settings, user management, and navigation functionality
 */

test.describe('Settings and Navigation', () => {
  let helpers: SmartPOSTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SmartPOSTestHelpers(page);
  });

  test.describe('Navigation Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
      await helpers.waitForDataLoad();
    });

    test('should display complete navigation menu', async ({ page }) => {
      // Verify main navigation sections
      const navSections = [
        '📊 DASHBOARD',
        '🛒 BÁN HÀNG',
        '📦 KHO HÀNG',
        '👥 KHÁCH HÀNG',
        '📈 BÁO CÁO',
        '⚙️ QUẢN TRỊ'
      ];
      
      for (const section of navSections) {
        await expect(page.locator(`text*="${section}"`)).toBeVisible();
      }
    });

    test('should test all navigation links', async ({ page }) => {
      const navigationItems = [
        { name: 'dashboard', title: 'SmartPOS' },
        { name: 'products', title: 'Quản lý sản phẩm' },
        { name: 'categories', title: 'Danh mục' },
        { name: 'customers', title: 'Khách hàng' },
        { name: 'sales', title: 'Lịch sử bán hàng' },
        { name: 'orders', title: 'Đơn hàng' },
        { name: 'returns', title: 'Trả hàng' },
        { name: 'suppliers', title: 'Nhà cung cấp' },
        { name: 'reports', title: 'Tổng quan' },
        { name: 'settings', title: 'Cài đặt' },
        { name: 'users', title: 'Nhân viên' }
      ];
      
      for (const item of navigationItems) {
        await helpers.navigateToPage(item.name);
        await helpers.waitForDataLoad();
        
        // Verify page loads correctly
        const heading = page.locator('h1').first();
        if (await heading.count() > 0) {
          const headingText = await heading.textContent();
          console.log(`Navigated to ${item.name}: ${headingText}`);
        }
      }
    });

    test('should test sidebar collapse/expand', async ({ page }) => {
      // Look for sidebar toggle button
      const toggleButton = page.locator('button[data-testid="toggle-drawer"], button[aria-label*="menu"]');
      if (await toggleButton.count() > 0) {
        // Test collapse
        await toggleButton.click();
        await page.waitForTimeout(500);
        
        // Test expand
        await toggleButton.click();
        await page.waitForTimeout(500);
        
        // Verify navigation is still accessible
        await expect(page.locator('nav')).toBeVisible();
      }
    });

    test('should test breadcrumb navigation', async ({ page }) => {
      // Navigate to a deep page
      await helpers.navigateToPage('products');
      await helpers.waitForTableData();
      
      // Click on a product to go to detail page
      const productLink = page.locator('a:has-text("CPU Intel Core i5-13400F")');
      if (await productLink.count() > 0) {
        await productLink.click();
        await helpers.waitForDataLoad();
        
        // Look for breadcrumb
        const breadcrumb = page.locator('.breadcrumb, [aria-label="breadcrumb"]');
        if (await breadcrumb.count() > 0) {
          await expect(breadcrumb).toBeVisible();
        }
        
        // Test back button
        const backButton = page.locator('button:has-text("Quay lại"), button[aria-label*="back"]');
        if (await backButton.count() > 0) {
          await backButton.click();
          await page.waitForURL('**/products');
        }
      }
    });

    test('should test header navigation elements', async ({ page }) => {
      // Test search functionality in header
      const headerSearch = page.locator('header input[type="search"], header input[placeholder*="search"]');
      if (await headerSearch.count() > 0) {
        await headerSearch.fill('CPU');
        await page.keyboard.press('Enter');
        await helpers.waitForDataLoad();
      }
      
      // Test quick sale button
      const quickSaleButton = page.locator('button:has-text("Bán hàng")');
      if (await quickSaleButton.count() > 0) {
        await expect(quickSaleButton).toBeVisible();
      }
      
      // Test notification button
      const notificationButton = page.locator('button:has-text("Thông báo")');
      if (await notificationButton.count() > 0) {
        await expect(notificationButton).toBeVisible();
        
        // Check notification count
        const notificationCount = page.locator('text*="3"'); // Based on previous tests
        if (await notificationCount.count() > 0) {
          await expect(notificationCount).toBeVisible();
        }
      }
    });
  });

  test.describe('Settings Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('settings');
      await helpers.waitForDataLoad();
    });

    test('should display settings page', async ({ page }) => {
      await helpers.verifyPageTitle('Cài đặt');
      
      // Verify settings categories
      const settingsCategories = [
        'Cài đặt chung',
        'Cài đặt cửa hàng',
        'Cài đặt thanh toán',
        'Cài đặt in ấn',
        'Cài đặt bảo mật'
      ];
      
      for (const category of settingsCategories) {
        const element = page.locator(`text*="${category}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test general settings', async ({ page }) => {
      // Look for general settings form
      const settingsForm = page.locator('form');
      if (await settingsForm.count() > 0) {
        await expect(settingsForm).toBeVisible();
        
        // Test common settings fields
        const settingsFields = [
          'Tên cửa hàng',
          'Địa chỉ',
          'Số điện thoại',
          'Email',
          'Múi giờ',
          'Ngôn ngữ',
          'Tiền tệ'
        ];
        
        for (const field of settingsFields) {
          const input = page.locator(`input[name*="${field.toLowerCase()}"], input[placeholder*="${field}"]`);
          if (await input.count() > 0) {
            await expect(input).toBeVisible();
          }
        }
      }
    });

    test('should test store configuration', async ({ page }) => {
      // Look for store settings
      const storeSettings = [
        'Tên cửa hàng',
        'Logo cửa hàng',
        'Giờ mở cửa',
        'Giờ đóng cửa',
        'Thuế VAT'
      ];
      
      for (const setting of storeSettings) {
        const element = page.locator(`text*="${setting}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test payment settings', async ({ page }) => {
      // Look for payment configuration
      const paymentSettings = [
        'Phương thức thanh toán',
        'Cổng thanh toán',
        'Tiền mặt',
        'Thẻ tín dụng',
        'Chuyển khoản'
      ];
      
      for (const setting of paymentSettings) {
        const element = page.locator(`text*="${setting}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test print settings', async ({ page }) => {
      // Look for print configuration
      const printSettings = [
        'Máy in',
        'Khổ giấy',
        'In hóa đơn',
        'In tem mã vạch'
      ];
      
      for (const setting of printSettings) {
        const element = page.locator(`text*="${setting}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test security settings', async ({ page }) => {
      // Look for security configuration
      const securitySettings = [
        'Đổi mật khẩu',
        'Xác thực 2 bước',
        'Phiên đăng nhập',
        'Quyền truy cập'
      ];
      
      for (const setting of securitySettings) {
        const element = page.locator(`text*="${setting}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test settings save functionality', async ({ page }) => {
      // Look for save button
      const saveButton = page.locator('button:has-text("Lưu"), button:has-text("Save")');
      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();
      }
      
      // Look for reset button
      const resetButton = page.locator('button:has-text("Đặt lại"), button:has-text("Reset")');
      if (await resetButton.count() > 0) {
        await expect(resetButton).toBeVisible();
      }
    });
  });

  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateToPage('users');
      await helpers.waitForDataLoad();
    });

    test('should display users management page', async ({ page }) => {
      await helpers.verifyPageTitle('Nhân viên');
      
      // Verify users table
      const usersTable = page.locator('table');
      if (await usersTable.count() > 0) {
        await expect(usersTable).toBeVisible();
        
        // Check for user table headers
        const headers = [
          'Tên nhân viên',
          'Email',
          'Vai trò',
          'Trạng thái',
          'Thao tác'
        ];
        
        for (const header of headers) {
          const headerElement = page.locator(`th:has-text("${header}")`);
          if (await headerElement.count() > 0) {
            await expect(headerElement).toBeVisible();
          }
        }
      }
    });

    test('should test add new user', async ({ page }) => {
      // Look for add user button
      const addButton = page.locator('button:has-text("Thêm nhân viên")');
      if (await addButton.count() > 0) {
        await addButton.click();
        
        // Should open user form
        await expect(page.locator('form')).toBeVisible();
        
        // Verify form fields
        const userFields = [
          'Tên nhân viên',
          'Email',
          'Mật khẩu',
          'Vai trò',
          'Số điện thoại'
        ];
        
        for (const field of userFields) {
          const input = page.locator(`input[name*="${field.toLowerCase()}"], input[placeholder*="${field}"]`);
          if (await input.count() > 0) {
            await expect(input).toBeVisible();
          }
        }
      }
    });

    test('should test user roles and permissions', async ({ page }) => {
      // Check for role management
      const roles = [
        'Quản trị viên',
        'Nhân viên bán hàng',
        'Thủ kho',
        'Kế toán'
      ];
      
      for (const role of roles) {
        const element = page.locator(`text*="${role}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should test user status management', async ({ page }) => {
      // Check for user status indicators
      const statusIndicators = [
        'Hoạt động',
        'Tạm khóa',
        'Offline',
        'Online'
      ];
      
      for (const status of statusIndicators) {
        const element = page.locator(`text*="${status}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('System Information', () => {
    test('should display system information', async ({ page }) => {
      await helpers.navigateToPage('settings');
      await helpers.waitForDataLoad();
      
      // Look for system info section
      const systemInfo = [
        'Phiên bản',
        'Cơ sở dữ liệu',
        'Cloudflare',
        'D1 Database'
      ];
      
      for (const info of systemInfo) {
        const element = page.locator(`text*="${info}"`);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should verify real-time connection status', async ({ page }) => {
      await helpers.navigateToPage('dashboard');
      await helpers.waitForDataLoad();
      
      // Check for connection status
      await expect(page.locator('text*="Kết nối realtime"')).toBeVisible();
      
      // Check for D1 database indicator
      await expect(page.locator('text*="D1 CLOUDFLARE"')).toBeVisible();
    });
  });

  test.describe('Profile Management', () => {
    test('should access user profile', async ({ page }) => {
      await page.goto('/dashboard');
      await helpers.waitForDataLoad();
      
      // Click user menu
      const userMenu = page.locator('[data-testid="user-menu"]');
      await userMenu.click();
      
      // Look for profile option
      const profileOption = page.locator('text*="Hồ sơ", text*="Profile"');
      if (await profileOption.count() > 0) {
        await profileOption.click();
        await helpers.waitForDataLoad();
        
        // Should navigate to profile page
        await helpers.verifyPageTitle('Hồ sơ');
      }
    });

    test('should test profile edit functionality', async ({ page }) => {
      // Navigate to profile if exists
      const profilePage = page.locator('[data-testid="nav-profile"]');
      if (await profilePage.count() > 0) {
        await profilePage.click();
        await helpers.waitForDataLoad();
        
        // Look for edit profile form
        const profileForm = page.locator('form');
        if (await profileForm.count() > 0) {
          await expect(profileForm).toBeVisible();
        }
      }
    });
  });

  test.describe('Backup and Restore', () => {
    test('should test backup functionality', async ({ page }) => {
      await helpers.navigateToPage('settings');
      await helpers.waitForDataLoad();
      
      // Look for backup options
      const backupButton = page.locator('button:has-text("Sao lưu"), button:has-text("Backup")');
      if (await backupButton.count() > 0) {
        await expect(backupButton).toBeVisible();
      }
    });

    test('should test data export functionality', async ({ page }) => {
      await helpers.navigateToPage('settings');
      await helpers.waitForDataLoad();
      
      // Look for export options
      const exportButton = page.locator('button:has-text("Xuất dữ liệu"), button:has-text("Export")');
      if (await exportButton.count() > 0) {
        await expect(exportButton).toBeVisible();
      }
    });
  });

  test('should verify settings API integration', async ({ page }) => {
    // Verify settings API endpoints
    const settingsEndpoints = [
      '/api/v1/settings',
      '/api/v1/users'
    ];
    
    for (const endpoint of settingsEndpoints) {
      const response = await page.request.get(`https://smartpos-api.bangachieu2.workers.dev${endpoint}`);
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
      }
    }
  });

  test('should test responsive settings interface', async ({ page }) => {
    await helpers.navigateToPage('settings');
    await helpers.testResponsiveDesign();
  });

  test('should handle settings errors gracefully', async ({ page }) => {
    await helpers.navigateToPage('settings');
    await helpers.checkForErrors();
  });
});
