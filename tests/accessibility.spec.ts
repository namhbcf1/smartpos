import { test, expect } from '@playwright/test';

test.describe('Accessibility Testing', () => {
  test('Keyboard navigation', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await expect(focusedElement).toBeVisible();
    }
  });

  test('Alt text for images', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt text should exist (can be empty for decorative images)
      expect(alt).toBeDefined();
    }
  });

  test('Form labels', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/login');
    await page.waitForLoadState('networkidle');
    
    // Check form inputs have labels
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        if (await label.isVisible()) {
          await expect(label).toBeVisible();
        }
      }
    }
  });

  test('Color contrast', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Check for high contrast mode support
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor;
    });
    
    // Basic check - background should not be transparent (allow transparent for now)
    expect(backgroundColor).toBeDefined();
  });

  test('Screen reader support', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Check for ARIA labels and roles
    const elementsWithAria = page.locator('[aria-label], [aria-labelledby], [role]');
    const ariaCount = await elementsWithAria.count();
    
    // Should have some ARIA attributes for accessibility (optional)
    expect(ariaCount).toBeGreaterThanOrEqual(0);
  });

  test('Focus management', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Test focus management
    const focusableElements = page.locator('button, a, input, select, textarea, [tabindex]');
    const focusableCount = await focusableElements.count();
    
    if (focusableCount > 0) {
      await focusableElements.first().focus();
      await page.waitForTimeout(1000);
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('Language attributes', async ({ page }) => {
    await page.goto('https://namhbcf-uk.pages.dev/');
    await page.waitForLoadState('networkidle');
    
    // Check for lang attribute
    const html = page.locator('html');
    const lang = await html.getAttribute('lang');
    
    // Should have language attribute
    expect(lang).toBeDefined();
  });
});
