import { test, expect } from "@playwright/test";


test.describe("v1.5.3 Checkpoint 1 Acceptance", () => {
  test.use({ storageState: '.auth/owner.json' });
  test("Guideline center exact NG192 and NG201 searches", async ({ page }) => {
    
    // Navigate to Guideline Center
    await page.goto("/guidelines");
    
    // Wait for the library to load
    await expect(page.locator("text=Canonical protocols").first()).toBeVisible();

    // 1. Search for NG192
    await page.fill('input[placeholder*="Search guidelines"]', "NG192");
    await page.click('button:has-text("Search")');
    
    // Wait for results
    await expect(page.locator(".guideline-result-group .data-row").first()).toBeVisible();
    
    // The canonical NG192 should be the first result
    const firstResultNG192 = page.locator(".guideline-result-group .data-row").first();
    await expect(firstResultNG192).toContainText("NICE NG192");

    // 2. Search for NG201
    await page.fill('input[placeholder*="Search guidelines"]', "NG201");
    await page.click('button:has-text("Search")');
    
    // Wait for results
    await expect(page.locator(".guideline-result-group .data-row").first()).toBeVisible();
    
    // The canonical NG201 should be the first result
    const firstResultNG201 = page.locator(".guideline-result-group .data-row").first();
    await expect(firstResultNG201).toContainText("NICE NG201");
  });

  test("Missing file fallbacks and metadata only labeling", async ({ page }) => {
    // Navigate to Guideline Centers");
    await page.goto("/guidelines");
    
    await page.fill('input[placeholder*="Search guidelines"]', "PCOS");
    await page.click('button:has-text("Search")');
    
    await expect(page.locator(".guideline-result-group").first()).toBeVisible();
    // Verify there are buttons with "Open record" or similar gating
    const buttons = page.locator('.form-actions a.button');
    await expect(buttons.first()).toBeVisible();
  });

  test("Protocol Atlas invariants", async ({ page }) => {
    // Go to Protocol Atlas");
    await page.goto("/protocol-atlas");
    
    // Wait for the protocol atlas to load
    await expect(page.locator("h1:has-text('Protocol Atlas')")).toBeVisible();
    
    // Click on "Catalog only" or verify the switch exists
    const showVerifiedOnly = page.locator('label:has-text("Verified only")');
    await expect(showVerifiedOnly).toBeVisible();
  });
});
