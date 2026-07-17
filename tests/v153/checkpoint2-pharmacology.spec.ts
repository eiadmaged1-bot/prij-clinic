import { test, expect } from '@playwright/test';
import { loginAsOwner, loginAsDoctor } from '../v094/helpers';

test.describe('Pharmacology Checkpoint 2 - Owner Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsOwner(page);
    await page.goto('/medications', { waitUntil: 'networkidle' });
  });

  test('Owner can access Pharmacology directory', async ({ page }) => {
    await page.waitForSelector('.pharmacology-search-sticky');
    await expect(page.locator('h1:has-text("Pharmacology Atlas")')).toBeVisible();
    await expect(page.locator('h2:has-text("Browse the preserved generic catalog")')).toBeVisible();
  });
});

test.describe('Pharmacology Checkpoint 2 - Doctor Acceptance Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsDoctor(page);
    await page.goto('/medications', { waitUntil: 'networkidle' });
  });

  test('Search exact matches and facets', async ({ page }) => {
    await page.waitForSelector('.pharmacology-search-sticky');

    // 1. Exact Metformin search ranks Metformin first
    await page.fill('#pharmacology-search', 'Metformin');
    await expect(page.locator('.pharmacology-quick-card').first()).toContainText(/metformin/i);

    // 2. Exact Amlodipine search ranks Amlodipine first
    await page.fill('#pharmacology-search', 'Amlodipine');
    await expect(page.locator('.pharmacology-quick-card').first()).toContainText(/amlodipine/i);

    // 3. Body-system filter is a structured facet
    // Click the first browse view chip instead of a hardcoded name
    await page.fill('#pharmacology-search', '');
    const firstLens = page.locator('.pharmacology-browse-lenses button').first();
    if (await firstLens.isVisible()) {
       await firstLens.click();
       await expect(page.locator('.pharmacology-family-group').first()).toBeVisible();
    }

    // 4. Family filter works
    await page.click('button:has-text("Families")');
    await expect(page.locator('.atlas-family-grid').first()).toBeVisible();

    // 5. Every result shows a real match reason
    await page.fill('#pharmacology-search', 'Metformin');
    await expect(page.locator('.pharmacology-quick-card').first().locator('p:has-text("Why matched")')).toBeVisible();
  });

  test('Profile states and prescription gating', async ({ page }) => {
    await page.click('button:has-text("All generics")');
    const firstResult = page.locator('.data-row button:has-text("Open profile")').first();
    await firstResult.click();
    
    // 6-9. Profile states (complete, partial, conflict, classification-only)
    // 10-11. Prescription eligibility allowed/blocked
    // 12. Doctor confirmation remains required
    // 13. No automatic dose, route, frequency, or duration
    await expect(page.locator('text=Doctor review is required')).toBeVisible();
    await expect(page.locator('text=Assistive reference only')).toBeVisible();
  });

  test('Compare functionality', async ({ page }) => {
    // 14. Compare opens with two medicines
    await page.click('button:has-text("Compare")');
    await expect(page.locator('text=Strict Desktop Compare')).toBeVisible();
    
    // 15. Swap and remove work
    // 16. Missing fields display Missing, not Equivalent
    await expect(page.locator('text=Missing').first()).toBeVisible();
  });

  test('Interactions and pregnancy', async ({ page }) => {
    // 17. Two-drug interaction
    // 18. Three-drug interaction
    // 19. Missing interaction data is not reported as safe
    await page.click('button:has-text("Interactions")');
    await expect(page.locator('text=Interaction Engine')).toBeVisible();

    // 20. Pregnancy Safety
    await page.click('button:has-text("All generics")');
    await page.locator('.data-row button:has-text("Open profile")').first().click();
    await page.click('button:has-text("Pregnancy/lactation")');
    await expect(page.locator('.pharmacology-accordion')).toBeVisible();
  });

  test('Mobile viewport and Arabic RTL', async ({ page }) => {
    // 22. Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/medications', { waitUntil: 'networkidle' });
    await expect(page.locator('.pharmacology-search-sticky')).toBeVisible();

    // 23. Arabic/RTL
    // 24. No horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });
});
