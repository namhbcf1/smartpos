import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for production testing
 * Performs authentication and initial setup
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Production Testing Global Setup...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📡 Connecting to production website...');
    const base = process.env.BASE_URL || config.projects?.[0]?.use?.baseURL || 'https://namhbcf-uk.pages.dev';
    await page.goto(base + '/login');

    // Wait just for DOM content; avoid networkidle due to worker redirects
    await page.waitForLoadState('domcontentloaded');

    console.log('🔐 Performing authentication...');

    // Check if we're on login page or already authenticated
    const isLoginPage = true;

    if (isLoginPage) {
      // Fill login form
      const usernameField = await page.getByTestId('login-username-input');
      await usernameField.fill('admin');

      const passwordField = await page.getByTestId('login-password-input');
      await passwordField.fill('admin123');

      // Submit login form
      await page.getByRole('button', { name: 'Đăng nhập' }).click();

      // Wait for redirect to dashboard or main page
      await page.waitForURL(/\/(dashboard|home|main|pos)/, { timeout: 30000 });
      console.log('✅ Successfully authenticated');
    } else {
      console.log('ℹ️  Already authenticated or no login required');
    }

    // Save authentication state
    await context.storageState({ path: 'production-test-results/auth-state.json' });
    console.log('💾 Authentication state saved');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('✅ Global setup completed successfully');
}

export default globalSetup;