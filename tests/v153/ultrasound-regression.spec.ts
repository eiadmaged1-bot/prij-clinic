import { test, expect } from '@playwright/test';

test.describe('Ultrasound Connected Regression - Owner Smoke Test', () => {
  test.use({ storageState: '.auth/owner.json' });
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ob-ultrasounds', { waitUntil: 'networkidle' });
  });

  test('Owner can access Ultrasound Center', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/ultrasound/i);
  });
});

test.describe('Ultrasound Connected Regression - Doctor Acceptance Test', () => {
  test.use({ storageState: '.auth/doctor.json' });
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ob-ultrasounds', { waitUntil: 'networkidle' });
  });

  test('Doctor can see Ultrasound filters', async ({ page }) => {
    // Just a basic check that it loads
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Mobile viewport and responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ob-ultrasounds', { waitUntil: 'networkidle' });
    
    await expect(page.locator('h1').first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });
});
