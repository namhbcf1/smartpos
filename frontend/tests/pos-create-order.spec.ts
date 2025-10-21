import { test, expect } from '@playwright/test';

test('POS -> create order (cash)', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu').fill('admin123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await page.waitForURL('**/dashboard');
  await page.goto('/pos');

  // search and pick a product
  await page.getByTestId('pos-search-input').fill('');
  await page.getByTestId('pos-search-input').fill('a');
  await page.waitForTimeout(800);
  // click the first product result card
  const itemsBefore = await page.locator('text=Giỏ hàng (').first().innerText();

  // This clicks the first product card in the list
  await page.locator('role=img[name="shopping cart"]').first().click({ trial: true }).catch(() => {});
  // fallback: click first paper card
  await page.locator('div.MuiPaper-root').nth(2).click({ force: true }).catch(() => {});

  // open payment dialog
  await page.getByRole('button', { name: /Thanh toán/ }).click();
  await page.getByTestId('pos-amount-input').fill('100000000');
  await page.getByTestId('pos-complete-button').click();

  // Expect success toast
  await expect(page.getByText('Tạo đơn hàng thành công')).toBeVisible({ timeout: 10000 });
});

