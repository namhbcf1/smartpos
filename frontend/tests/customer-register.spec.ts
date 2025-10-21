import { test, expect } from '@playwright/test';

// E2E: Public Customer Registration
// Visits /dangky-khach-hang, fills required fields, submits, and verifies success alert.

test('customer registration public form submits successfully', async ({ page }) => {
  const fullUrl = 'https://namhbcf-uk.pages.dev/dangky-khach-hang';

  // Navigate
  await page.goto(fullUrl, { waitUntil: 'networkidle' });

  // Ensure title visible
  await expect(page.getByText('Đăng ký thông tin khách hàng')).toBeVisible({ timeout: 15000 });

  // Fill required fields with unique data
  const ts = Date.now();
  await page.getByLabel('Họ và tên').fill(`Playwright Test User ${ts}`);
  await page.getByLabel('Số điện thoại').fill(`09123${ts.toString().slice(-5)}`);
  await page.getByLabel('Email').fill(`pw_${ts}@example.com`);
  await page.getByLabel('Địa chỉ').fill('123 Playwright Street');

  // Optional notes
  await page.getByLabel('Ghi chú').fill('Playwright automated test');

  // Submit
  await page.getByRole('button', { name: 'Gửi đăng ký' }).click();

  // Expect success alert
  await expect(page.getByText('Đăng ký thông tin khách hàng thành công')).toBeVisible({ timeout: 15000 });
});