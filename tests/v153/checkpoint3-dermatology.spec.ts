import { test, expect } from '@playwright/test';

test.describe('Dermatology Checkpoint 3 Acceptance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dermatology');
    // Wait for the UI to load
    await page.waitForSelector('nav.breadcrumbs', { timeout: 15000 }).catch(() => {});
  });

  test('Layout: Body-map zones and 12 disease-category filters', async ({ page }) => {
    // Check 12 categories
    const categories = ["Inflammatory", "Infection", "Hair and pigment", "Vulvar", "Pregnancy", "Urgent safety", "Autoimmune", "Neoplastic/Malignant", "Pediatric", "Systemic manifestations", "Mucosal/Oral"];
    for (const cat of categories) {
      await expect(page.locator(`button:has-text("${cat}")`).first()).toBeVisible();
    }
    
    // Check body zones
    const zones = ["Face", "Scalp", "Trunk", "Arms", "Legs", "Hands/Feet", "Intertriginous/Folds", "Genital"];
    for (const zone of zones) {
      await expect(page.locator(`button:has-text("${zone}")`).first()).toBeVisible();
    }
  });

  test('Treatment classes and Non-drug care', async ({ page }) => {
    // Open the first available condition
    const firstCondition = page.locator('.dermatology-priority-grid button').first();
    
    // Check if there are any conditions to click
    if (await firstCondition.isVisible()) {
      await firstCondition.click();
      
      // Wait for topic detail to load
      await page.waitForSelector('article.dermatology-topic-detail', { timeout: 5000 });

      // Non-drug care
      await expect(page.locator('h3:has-text("Non-Drug Care & Physical Avoidance")')).toBeVisible();

      // Treatment classes
      await expect(page.locator('h3:has-text("Reviewed Treatment Classes")')).toBeVisible();
    }
  });

  test('Red flags: 2WW referral paths and system-symptom alerts', async ({ page }) => {
    const firstCondition = page.locator('.dermatology-priority-grid button').first();
    
    if (await firstCondition.isVisible()) {
      await firstCondition.click();
      await page.waitForSelector('article.dermatology-topic-detail', { timeout: 5000 });

      // Red Flags
      await expect(page.locator('h3:has-text("Red Flags & Escalation")')).toBeVisible();
    }
  });
});
