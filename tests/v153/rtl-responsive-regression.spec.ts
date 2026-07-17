import { test, expect } from '@playwright/test';

test.describe('Arabic/RTL and responsive regression', () => {
  test.use({ storageState: '.auth/doctor.json' });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Investigations Center - RTL Layout', async ({ page }) => {
    await page.goto('/investigations', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    
    await expect(page.locator('.investigation-catalog-layout')).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });

  test('Ultrasound Center - RTL Layout', async ({ page }) => {
    await page.goto('/ob-ultrasounds', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    
    await expect(page.locator('h1').first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });

  test('Pharmacology - RTL Layout', async ({ page }) => {
    await page.goto('/medications', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    
    await expect(page.locator('h1').first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });

  test('Dermatology - RTL Layout', async ({ page }) => {
    await page.goto('/dermatology', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    
    await expect(page.locator('.dermatology-workspace')).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });
});
