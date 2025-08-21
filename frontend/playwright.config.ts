// Playwright Configuration for ComputerPOS Pro
// Vietnamese Computer Hardware POS System Testing

import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://pos-frontend-bangachieu2.pages.dev',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording */
    video: 'retain-on-failure',
    
    /* Vietnamese locale for testing */
    locale: 'vi-VN',
    
    /* Timezone for Vietnamese business hours */
    timezoneId: 'Asia/Ho_Chi_Minh',
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports for Vietnamese mobile users */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers for Vietnamese market */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },

  /* Global setup for Vietnamese POS testing */
  globalSetup: './tests/global-setup.ts',

  /* Global teardown */
  globalTeardown: './tests/global-teardown.ts',

  /* Test timeout for Vietnamese network conditions */
  timeout: 30 * 1000, // 30 seconds

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },

  /* Maximum failures before stopping */
  maxFailures: process.env.CI ? 10 : undefined,

  /* Output directory */
  outputDir: 'test-results/',

  /* Metadata for Vietnamese POS testing */
  metadata: {
    'test-environment': 'Vietnamese Computer Hardware POS',
    'target-domain': process.env.PLAYWRIGHT_BASE_URL || 'https://computerpos-pro.pages.dev',
    'locale': 'vi-VN',
    'currency': 'VND',
    'timezone': 'Asia/Ho_Chi_Minh'
  }
});
