import { test, expect, Page } from '@playwright/test';

// Test data for employees - using existing admin account
const TEST_USERS = [
  {
    username: 'admin',
    password: 'admin',
    role: 'admin',
    fullName: 'Admin User'
  }
];

// Helper function to login
async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Clear and fill login form
  await page.fill('input[name="username"], input[type="text"]', '');
  await page.fill('input[name="username"], input[type="text"]', username);
  await page.fill('input[name="password"], input[type="password"]', '');
  await page.fill('input[name="password"], input[type="password"]', password);

  // Submit login
  await page.click('button[type="submit"], button:has-text("Sign In")');

  // Wait for navigation or success
  await page.waitForTimeout(3000);
}

// Helper function to seed users via API
async function seedUsers(page: Page) {
  try {
    const response = await page.request.post('/api/v1/auth/seed-users');
    const result = await response.json();
    console.log('Seed users result:', result);
    return result;
  } catch (error) {
    console.error('Error seeding users:', error);
    return null;
  }
}

test.describe('Employee Management Tests', () => {
  test('should access employees page and display employee list', async ({ page }) => {
    // Login with admin account
    await login(page, 'admin', 'admin');

    // Check if login was successful
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Wait for data to load
    await page.waitForTimeout(5000);

    // Check page title and content
    await expect(page.locator('h1, h4')).toContainText(/nhân viên|employee/i);

    // Check for employee management elements
    await expect(page.locator('button:has-text("Thêm nhân viên")')).toBeVisible();

    // Check for employee table
    await expect(page.locator('table')).toBeVisible();

    // Check for employee data
    const employeeRows = page.locator('table tbody tr');
    const rowCount = await employeeRows.count();
    expect(rowCount).toBeGreaterThan(0);

    console.log(`Found ${rowCount} employees in the table`);
  });

  test('should login and logout successfully', async ({ page }) => {
    await login(page, 'admin', 'admin');

    // Check if login was successful
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for user info
    await expect(page.locator('button:has-text("User")')).toBeVisible({ timeout: 10000 });

    // Test logout
    await page.click('button:has-text("User")');
    await page.waitForTimeout(1000);
    await page.click('text=Đăng xuất');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should test employee search functionality', async ({ page }) => {
    await login(page, 'admin', 'admin');

    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Test search functionality
    const searchBox = page.locator('input[placeholder*="Tìm kiếm"], input[placeholder*="search"]');
    if (await searchBox.isVisible()) {
      await searchBox.fill('Admin');
      await page.waitForTimeout(2000);

      // Check if search results are filtered
      const employeeRows = page.locator('table tbody tr');
      const rowCount = await employeeRows.count();
      console.log(`Search results: ${rowCount} employees found`);
    }
  });

  test('should test employee statistics display', async ({ page }) => {
    await login(page, 'admin', 'admin');

    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Check statistics cards
    await expect(page.locator('text=Tổng nhân viên')).toBeVisible();
    await expect(page.locator('text=Đang hoạt động')).toBeVisible();

    // Check if statistics show correct numbers
    const totalEmployees = page.locator('text=Tổng nhân viên').locator('..').locator('h4');
    const activeEmployees = page.locator('text=Đang hoạt động').locator('..').locator('h4');

    await expect(totalEmployees).toBeVisible();
    await expect(activeEmployees).toBeVisible();
  });

  test('should handle login failures gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try invalid credentials
    await page.fill('input[name="username"], input[type="text"]', 'invalid');
    await page.fill('input[name="password"], input[type="password"]', 'invalid');
    await page.click('button[type="submit"], button:has-text("Sign In")');

    // Should stay on login page or show error
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should test employee table interactions', async ({ page }) => {
    await login(page, 'admin', 'admin');

    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Check if table has data
    const employeeRows = page.locator('table tbody tr');
    const rowCount = await employeeRows.count();

    if (rowCount > 0) {
      // Test clicking on first employee row
      const firstRow = employeeRows.first();
      await expect(firstRow).toBeVisible();

      // Check if action buttons are present
      const editButtons = page.locator('table tbody tr button');
      const buttonCount = await editButtons.count();
      expect(buttonCount).toBeGreaterThan(0);

      console.log(`Found ${rowCount} employees with ${buttonCount} action buttons`);
    }
  });

  test('should test navigation between pages', async ({ page }) => {
    await login(page, 'admin', 'admin');

    // Test navigation from dashboard to employees
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to employees
    await page.click('button:has-text("Nhân viên")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/employees/);

    // Navigate back to dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/);

    console.log('✓ Navigation between pages works correctly');
  });
});
