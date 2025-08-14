import { test, expect } from '@playwright/test';

/**
 * Simple Test to verify setup
 */

test('should load SmartPOS application', async ({ page }) => {
  await page.goto('https://222737d2.smartpos-web.pages.dev');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Verify page title
  await expect(page).toHaveTitle(/SmartPOS/);
  
  console.log(`Current URL: ${page.url()}`);
});

test('should verify dashboard loads with real data', async ({ page }) => {
  await page.goto('https://222737d2.smartpos-web.pages.dev/dashboard');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Verify we're on dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Verify real data indicators
  await expect(page.locator('text*="8"')).toBeVisible(); // Product count
  await expect(page.locator('text*="6"')).toBeVisible(); // Customer count
  
  console.log('✅ Dashboard loaded with real data');
});

test('should verify API connectivity', async ({ page }) => {
  // Test API endpoint directly
  const response = await page.request.get('https://smartpos-api.bangachieu2.workers.dev/api/v1/products');
  
  expect(response.status()).toBe(200);
  
  const data = await response.json();
  expect(data).toHaveProperty('success', true);
  expect(data).toHaveProperty('data');
  expect(data.data.data).toHaveLength(8);
  
  console.log('✅ API connectivity verified');
});
