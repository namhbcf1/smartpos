import { test, expect } from '@playwright/test'

// Basic smoke test for login flow against production Pages
test('can login with admin credentials and reach dashboard', async ({ page }) => {
  const base = process.env.BASE_URL || 'https://namhbcf-uk.pages.dev'
  await page.goto(`${base}/login`, { waitUntil: 'networkidle' })

  // Ensure form is visible
  await expect(page.getByTestId('login-username-input')).toBeVisible()

  await page.getByTestId('login-username-input').fill('admin')
  await page.getByTestId('login-password-input').fill('admin123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  // Expect redirect to dashboard
  await page.waitForURL(/\/dashboard|\/?$/, { timeout: 15000 })

  // Smoke check for some dashboard text
  await expect(page.locator('body')).toContainText('Dashboard', { timeout: 15000 })
})


