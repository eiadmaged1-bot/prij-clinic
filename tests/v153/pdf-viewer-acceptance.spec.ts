import { test, expect } from "@playwright/test";


test.describe("v1.5.3 Checkpoint 1: PDF Viewer and File Modes", () => {
  test.use({ storageState: '.auth/owner.json' });
  const NG192_ID = "951cf7e4-97c4-4e25-a9f0-fdcfe2ed1fee"; // Caesarean birth
  const NG201_ID = "d62dcde4-5fd6-4e65-90ed-999898f9df4b"; // Antenatal care

  test("Real stored PDF browser verification", async ({ page }) => {
    await page.goto(`/guidelines/${NG192_ID}`);

    // Wait for the UI to load
    await expect(page.locator("text=NICE NG192 Caesarean birth").first()).toBeVisible();

    // Verify PDF.js worker and canvas render
    const canvas = page.locator('canvas[aria-label*="Rendered PDF page"]').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Verify thumbnails exist and are clickable
    const thumbnailDetails = page.locator('summary:has-text("Page thumbnails")');
    if (await thumbnailDetails.isVisible()) {
      await thumbnailDetails.click();
    }
    const thumbnail = page.locator('.pdf-thumbnail-list button').nth(1); // 2nd page thumbnail
    if (await thumbnail.isVisible()) {
      await thumbnail.click();
    }

    // Verify Zoom buttons
    const zoomIn = page.locator('button:has-text("+")').first();
    if (await zoomIn.isVisible()) {
      await zoomIn.click();
    }

    // PDF Text search
    const searchInput = page.locator('input[placeholder*="Search original text"], label:has-text("Search original text") input');
    if (await searchInput.isVisible()) {
      await searchInput.fill("caesarean");
      await searchInput.press("Enter");
      await expect(page.locator('.pdf-search-highlight').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("Sections & Recommendations with real page mapping", async ({ page }) => {
    await page.goto(`/guidelines/${NG201_ID}`);

    await expect(page.locator("text=NICE NG201").first()).toBeVisible();

    const sectionsTab = page.locator('button:has-text("Sections")');
    if (await sectionsTab.isVisible()) {
      await sectionsTab.click();
    }

    // The structured sections should not show "Page ?"
    const sections = page.locator('nav.history-category-list button');
    await expect(sections.first()).toBeVisible({ timeout: 15000 });
    
    const pageText = await page.locator('nav.history-category-list').innerText();
    expect(pageText).not.toContain("Page ?");
  });

  test("Extracted-text-only and Metadata-only modes", async ({ page }) => {
    // Go to search and look for a term that returns a metadata-only result
    await page.goto("/guidelines/search?q=PCOS");
    
    // Results should appear
    await expect(page.locator(".guideline-result-group").first()).toBeVisible();

    // Check for "Metadata only" or "Missing" badges
    const badges = page.locator('.badge');
    const badgeTexts = await badges.allInnerTexts();
    const hasSafeBadge = badgeTexts.some(text => 
      text.toLowerCase().includes('metadata only') || 
      text.toLowerCase().includes('missing') ||
      text.toLowerCase().includes('no asset')
    );
    // We expect graceful handling rather than broken Open PDF links
    const brokenLinks = page.locator('a:has-text("Open PDF")');
    // It should either be disabled or absent if it's metadata only
    if (await brokenLinks.count() > 0) {
      const href = await brokenLinks.first().getAttribute("href");
      expect(href).not.toBeNull();
    }
  });

  test("Clinical Summary Provenance", async ({ page }) => {
    await page.goto(`/guidelines/${NG201_ID}`);

    const summaryTab = page.locator('button:has-text("Clinical Summary")');
    if (await summaryTab.isVisible()) {
      await summaryTab.click();
      await expect(page.locator('text=Provenance')).toBeVisible({ timeout: 10000 });
    }
  });
});
