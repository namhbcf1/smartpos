import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for SmartPOS E2E tests
 * Performs authentication and saves state for reuse
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting SmartPOS E2E Test Suite Global Setup...');
  
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🔐 Performing authentication setup...');

    // Navigate to the app
    await page.goto(`${baseURL}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    console.log(`Current URL: ${page.url()}`);

    // Check if we're on login page and need to authenticate
    if (page.url().includes('/login')) {
      console.log('On login page, checking for login form...');

      // Wait a bit more for the page to fully load
      await page.waitForTimeout(3000);

      // Check if login form exists
      const usernameInput = page.locator('input[name="username"]');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');

      if (await usernameInput.count() > 0) {
        console.log('Login form found, performing login...');

        // Fill login credentials
        await usernameInput.fill('admin');
        await passwordInput.fill('admin');

        // Submit login form
        await submitButton.click();

        // Wait for successful login (redirect to dashboard)
        await page.waitForURL('**/dashboard', { timeout: 15000 });
      } else {
        console.log('No login form found, waiting for auto-redirect...');
        await page.waitForURL('**/dashboard', { timeout: 15000 });
      }
    }

    // Verify we're logged in by checking for user menu button
    console.log(`After login URL: ${page.url()}`);

    // Wait for page to fully load after login
    await page.waitForLoadState('networkidle');

    // Check for user menu button (we found it works with aria-label)
    await page.waitForSelector('button[aria-label*="User"]', { timeout: 10000 });
    console.log('✅ User menu found successfully');

    // Save authentication state
    await page.context().storageState({ path: 'tests/e2e/auth-state.json' });

    console.log('✅ Authentication setup completed successfully');
    
    // Test API connectivity
    console.log('🔌 Testing API connectivity...');
    const response = await page.request.get('https://smartpos-api.bangachieu2.workers.dev/api/v1/products');
    
    if (response.ok()) {
      const data = await response.json();
      console.log(`✅ API connectivity verified - Found ${data.data?.data?.length || 0} products`);
    } else {
      console.warn('⚠️ API connectivity test failed, but continuing with tests');
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎯 Global setup completed - Ready to run tests!');
}

export default globalSetup;
