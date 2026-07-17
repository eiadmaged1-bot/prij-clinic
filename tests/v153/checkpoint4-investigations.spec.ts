import { test, expect } from '@playwright/test';

test.describe('Investigations Checkpoint 4 - Owner Smoke Test', () => {
  test.use({ storageState: '.auth/owner.json' });
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/investigations', { waitUntil: 'networkidle' });
  });

  test('Owner can access Investigations Library & Follow-up', async ({ page }) => {
    await page.waitForSelector('.investigation-catalog-layout');
    await expect(page.locator('h1:has-text("Investigation Library, Templates & Result Follow-up")')).toBeVisible();
    await expect(page.locator('.investigation-status-summary')).toBeVisible();
  });
});

test.describe('Investigations Checkpoint 4 - Doctor Acceptance Test', () => {
  test.use({ storageState: '.auth/doctor.json' });
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/investigations', { waitUntil: 'networkidle' });
  });

  test('Catalog search and category filters', async ({ page }) => {
    await page.waitForSelector('.investigation-catalog-layout');
    
    // Check categories exist
    const categories = ["Routine labs", "Antenatal", "Ultrasound", "Pathology"];
    for (const cat of categories) {
      await expect(page.locator(`button:has-text("${cat}")`).first()).toBeVisible();
    }

    // Search
    const searchInput = page.locator('input[placeholder*="CBC, AMH, ferritin"]');
    await searchInput.fill('CBC');
    await expect(page.locator('.investigation-quick-sections, .data-list').first()).toBeVisible();
  });

  test('Reusable investigation sets', async ({ page }) => {
    await page.waitForSelector('.investigation-catalog-layout');
    await expect(page.locator('h3:has-text("Reusable investigation sets")')).toBeVisible();
  });

  test('Result follow-up statuses', async ({ page }) => {
    await page.waitForSelector('.investigation-catalog-layout');
    
    const statuses = ["Needs review", "Overdue", "Received", "Patient informed", "Closed"];
    for (const status of statuses) {
      await expect(page.locator(`.investigation-status-summary button:has-text("${status}")`).first()).toBeVisible();
    }
  });

  test('Mobile viewport and responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/investigations', { waitUntil: 'networkidle' });
    
    await expect(page.locator('.investigation-catalog-layout')).toBeVisible();
    
    // Check if mobile tabs are visible
    await expect(page.locator('nav.investigation-mobile-tabs button:has-text("Results follow-up")')).toBeVisible();
    await expect(page.locator('nav.investigation-mobile-tabs button:has-text("Catalog administration")')).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });
});
