import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://222737d2.smartpos-web.pages.dev');
  await expect(page).toHaveTitle(/SmartPOS/);
});
