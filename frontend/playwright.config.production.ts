import { defineConfig, devices } from '@playwright/test';

/**
 * Production Testing Configuration for SmartPOS
 * Tests the live production deployment at https://bb9f942a.namhbcf-uk.pages.dev
 */
export default defineConfig({
  testDir: './tests/production',

  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for better debugging

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Opt out of parallel tests */
  workers: 1, // Single worker for production testing

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'production-test-results/html-report' }],
    ['json', { outputFile: 'production-test-results/results.json' }],
    ['list'],
    ['junit', { outputFile: 'production-test-results/results.xml' }]
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for production testing */
    baseURL: process.env.BASE_URL || 'https://namhbcf-uk.pages.dev',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Browser context options */
    ignoreHTTPSErrors: true,

    /* Test timeouts */
    actionTimeout: 30000, // 30 seconds for actions
    navigationTimeout: 60000, // 1 minute for navigation
  },

  /* Global test timeout */
  timeout: 120000, // 2 minutes per test

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5']
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12']
      },
    },
    {
      name: 'Tablet iPad',
      use: {
        ...devices['iPad Pro']
      },
    }
  ],

  /* Global setup and teardown */
  globalSetup: './tests/production/global-setup.ts',
  globalTeardown: './tests/production/global-teardown.ts',
});