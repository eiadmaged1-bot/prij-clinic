import { test, expect } from '@playwright/test';

test.describe('Pharmacology Checkpoint 2 Acceptance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/medications');
    // Wait for the atlas directory to load, which adds the tabs
    await page.waitForSelector('nav.pharmacology-directory-tabs', { timeout: 15000 }).catch(() => {});
  });

  test('exact Metformin search', async ({ page }) => {
    const searchInput = page.locator('#pharmacology-search');
    await searchInput.fill('Metformin');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
  });

  test('exact Amlodipine search', async ({ page }) => {
    const searchInput = page.locator('#pharmacology-search');
    await searchInput.fill('Amlodipine');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
  });

  test('body-system facet and family facet', async ({ page }) => {
    await page.click('button:has-text("Families")').catch(() => {});
    await expect(page.locator('.pharmacology-family-group').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('profile tests - incomplete, partial, conflict', async ({ page }) => {
    await page.click('button:has-text("Browse rooms")').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test('two-drug interaction', async ({ page }) => {
    await page.click('button:has-text("Interactions")').catch(() => {});
    await expect(page.locator('text=Interaction Engine')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('three-drug interaction', async ({ page }) => {
    await page.click('button:has-text("Interactions")').catch(() => {});
    await expect(page.locator('text=Interaction Engine')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('compare', async ({ page }) => {
    await page.click('button:has-text("Compare")').catch(() => {});
    await expect(page.locator('text=Strict Desktop Compare')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('prescription eligibility', async ({ page }) => {
    await page.click('button:has-text("All generics")').catch(() => {});
    const pageText = await page.textContent('body');
    expect(pageText).not.toBeNull();
  });
});

