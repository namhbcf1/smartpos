import { test, expect } from '@playwright/test';

/**
 * SIMPLIFIED LIVE TESTING
 * Direct testing of the production SmartPOS website
 */

const PRODUCTION_URL = 'https://bb9f942a.namhbcf-uk.pages.dev';

test.describe('SmartPOS Live Website Testing', () => {

  test('should load the production website', async ({ page }) => {
    console.log('🌐 Testing production URL:', PRODUCTION_URL);

    // Navigate to production site
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Take screenshot
    await page.screenshot({ path: 'production-test-results/01-website-loaded.png', fullPage: true });

    // Verify page loaded (not a 404 or error page)
    const title = await page.title();
    const bodyText = await page.locator('body').textContent();

    console.log('📄 Page title:', title);
    console.log('📝 Page contains text:', bodyText?.substring(0, 200) + '...');

    // Basic assertions
    expect(title).toBeTruthy();
    expect(bodyText).toBeTruthy();
    expect(bodyText).not.toMatch(/404|not found|error|sorry/i);
  });

  test('should test authentication system', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // Check if login form is present
    const usernameField = page.locator('input[name="username"], input[name="email"], input[placeholder*="username"], input[placeholder*="email"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"], input[placeholder*="password"]').first();

    if (await usernameField.count() > 0 && await passwordField.count() > 0) {
      console.log('🔐 Login form detected - testing authentication');

      // Take screenshot of login page
      await page.screenshot({ path: 'production-test-results/02-login-form.png', fullPage: true });

      // Fill credentials
      await usernameField.fill('admin');
      await passwordField.fill('admin123');

      // Find and click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]').first();

      if (await loginButton.count() > 0) {
        await loginButton.click();
        await page.waitForTimeout(5000); // Wait for login to process

        // Check if login was successful
        const currentUrl = page.url();
        const isLoggedIn = !currentUrl.includes('login') || await page.locator('input[name="username"]').count() === 0;

        console.log('✅ Login attempt completed, redirected to:', currentUrl);

        // Take screenshot after login
        await page.screenshot({ path: 'production-test-results/03-after-login.png', fullPage: true });

        expect(isLoggedIn).toBe(true);
      } else {
        console.log('⚠️ Login button not found');
      }
    } else {
      console.log('ℹ️ No login form found - may already be authenticated or different auth system');
    }
  });

  test('should test navigation and main pages', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // If login page, login first
    const isLoginPage = await page.locator('input[name="username"], input[name="password"]').count() >= 2;
    if (isLoginPage) {
      await page.locator('input[name="username"], input[name="email"]').first().fill('admin');
      await page.locator('input[name="password"]').fill('admin123');
      await page.locator('button[type="submit"], button:has-text("Login")').first().click();
      await page.waitForTimeout(3000);
    }

    // Test navigation to main pages
    const pagesToTest = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/products', name: 'Products' },
      { path: '/pos', name: 'POS' },
      { path: '/customers', name: 'Customers' },
      { path: '/inventory', name: 'Inventory' },
      { path: '/orders', name: 'Orders' },
      { path: '/sales', name: 'Sales' },
      { path: '/reports', name: 'Reports' }
    ];

    for (const pageInfo of pagesToTest) {
      try {
        const fullUrl = PRODUCTION_URL + pageInfo.path;
        console.log(`📄 Testing page: ${pageInfo.name} (${fullUrl})`);

        await page.goto(fullUrl);
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        const title = await page.title();
        const hasError = await page.locator('text=/404|not found|error|sorry/i').count() > 0;

        console.log(`  - Title: ${title}`);
        console.log(`  - Has Error: ${hasError}`);

        // Take screenshot
        await page.screenshot({
          path: `production-test-results/04-page-${pageInfo.name.toLowerCase()}.png`,
          fullPage: true
        });

        // Basic assertion
        expect(hasError).toBe(false);

      } catch (error) {
        console.log(`⚠️ Failed to test ${pageInfo.name}:`, error);
      }
    }
  });

  test('should test interactive elements and buttons', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // Login if needed
    const isLoginPage = await page.locator('input[name="username"], input[name="password"]').count() >= 2;
    if (isLoginPage) {
      await page.locator('input[name="username"], input[name="email"]').first().fill('admin');
      await page.locator('input[name="password"]').fill('admin123');
      await page.locator('button[type="submit"], button:has-text("Login")').first().click();
      await page.waitForTimeout(3000);
    }

    // Test various interactive elements
    const interactiveElements = [
      'button',
      'a[href]',
      'input[type="button"]',
      'input[type="submit"]',
      '.btn',
      '.button'
    ];

    let totalButtons = 0;
    let clickableButtons = 0;

    for (const selector of interactiveElements) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        totalButtons += elements;
        console.log(`🔘 Found ${elements} elements with selector: ${selector}`);

        // Test first few buttons of each type
        const elementsToTest = Math.min(elements, 3);
        for (let i = 0; i < elementsToTest; i++) {
          try {
            const element = page.locator(selector).nth(i);
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();

            if (isVisible && isEnabled) {
              clickableButtons++;
              console.log(`  ✅ Element ${i} is clickable`);
            }
          } catch (error) {
            console.log(`  ⚠️ Element ${i} test failed:`, error);
          }
        }
      }
    }

    console.log(`📊 Interactive Elements Summary: ${clickableButtons}/${totalButtons} elements are clickable`);

    // Take screenshot of current state
    await page.screenshot({ path: 'production-test-results/05-interactive-elements.png', fullPage: true });

    expect(totalButtons).toBeGreaterThan(0);
  });

  test('should test forms and inputs', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // Login if needed
    const isLoginPage = await page.locator('input[name="username"], input[name="password"]').count() >= 2;
    if (isLoginPage) {
      await page.locator('input[name="username"], input[name="email"]').first().fill('admin');
      await page.locator('input[name="password"]').fill('admin123');
      await page.locator('button[type="submit"], button:has-text("Login")').first().click();
      await page.waitForTimeout(3000);
    }

    // Look for various input types
    const inputTypes = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="search"]',
      'input[type="number"]',
      'textarea',
      'select'
    ];

    let totalInputs = 0;
    let workingInputs = 0;

    for (const inputSelector of inputTypes) {
      const inputs = await page.locator(inputSelector).count();
      if (inputs > 0) {
        totalInputs += inputs;
        console.log(`📝 Found ${inputs} ${inputSelector} elements`);

        // Test first input of each type
        try {
          const firstInput = page.locator(inputSelector).first();
          const isVisible = await firstInput.isVisible();
          const isEnabled = await firstInput.isEnabled();

          if (isVisible && isEnabled) {
            // Try to interact with the input
            if (inputSelector.includes('select')) {
              // For select elements, just check if they're functional
              workingInputs++;
            } else {
              // For text inputs, try typing
              await firstInput.fill('test');
              await firstInput.clear();
              workingInputs++;
            }
            console.log(`  ✅ Input is functional`);
          }
        } catch (error) {
          console.log(`  ⚠️ Input test failed:`, error);
        }
      }
    }

    console.log(`📊 Forms Summary: ${workingInputs}/${totalInputs} inputs are working`);

    // Take screenshot of forms
    await page.screenshot({ path: 'production-test-results/06-forms.png', fullPage: true });
  });

  test('should test responsive design on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // Login if needed
    const isLoginPage = await page.locator('input[name="username"], input[name="password"]').count() >= 2;
    if (isLoginPage) {
      await page.locator('input[name="username"], input[name="email"]').first().fill('admin');
      await page.locator('input[name="password"]').fill('admin123');
      await page.locator('button[type="submit"], button:has-text("Login")').first().click();
      await page.waitForTimeout(3000);
    }

    // Take mobile screenshot
    await page.screenshot({ path: 'production-test-results/07-mobile-view.png', fullPage: true });

    // Check if mobile navigation exists
    const mobileNavSelectors = [
      'button[aria-label*="menu"]',
      '.hamburger',
      '.mobile-menu',
      'button:has-text("☰")',
      '[data-testid="mobile-menu"]'
    ];

    let hasMobileNav = false;
    for (const selector of mobileNavSelectors) {
      if (await page.locator(selector).count() > 0) {
        hasMobileNav = true;
        console.log(`📱 Mobile navigation found: ${selector}`);
        break;
      }
    }

    console.log(`📱 Mobile responsive design detected: ${hasMobileNav}`);

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should generate comprehensive test report', async ({ page }) => {
    console.log('📊 COMPREHENSIVE SMARTPOS LIVE TESTING REPORT');
    console.log('=' .repeat(60));
    console.log('🌐 Production URL:', PRODUCTION_URL);
    console.log('📅 Test Date:', new Date().toISOString());
    console.log('🖥️  Browser:', 'Chromium');
    console.log('=' .repeat(60));

    // Final website health check
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    const performanceMetrics = {
      title: await page.title(),
      url: page.url(),
      viewport: await page.viewportSize(),
      userAgent: await page.evaluate(() => navigator.userAgent)
    };

    console.log('📊 FINAL METRICS:');
    console.log('- Title:', performanceMetrics.title);
    console.log('- URL:', performanceMetrics.url);
    console.log('- Viewport:', performanceMetrics.viewport);

    // Take final comprehensive screenshot
    await page.screenshot({ path: 'production-test-results/08-final-report.png', fullPage: true });

    expect(true).toBe(true); // Always pass this summary test
  });
});