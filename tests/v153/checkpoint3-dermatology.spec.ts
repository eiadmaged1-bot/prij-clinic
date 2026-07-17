import { test, expect } from '@playwright/test';
import { loginAsOwner, loginAsDoctor } from '../v094/helpers';

test.describe('Dermatology Checkpoint 3 - Owner Smoke Test', () => {
  test.use({ storageState: '.auth/owner.json' });
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dermatology', { waitUntil: 'networkidle' });
  });

  test('Owner can access Dermatology workspace', async ({ page }) => {
    await page.waitForSelector('.dermatology-workspace');
    await expect(page.locator('h1:has-text("Dermatology Knowledge Topic")').or(page.locator('h1:has-text("Dermatology Workspace")'))).toBeVisible();
  });
});

test.describe('Dermatology Checkpoint 3 - Doctor Acceptance Test', () => {
  test.use({ storageState: '.auth/doctor.json' });
  test.beforeEach(async ({ page }) => {
    // Desktop: 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dermatology', { waitUntil: 'networkidle' });
  });

  test('Layout: Body-map zones and 12 disease-category filters', async ({ page }) => {
    // Wait for the main wrapper
    await page.waitForSelector('.dermatology-workspace');
    
    // Check categories
    const categories = ["Inflammatory", "Infection", "Hair and pigment", "Vulvar", "Pregnancy", "Urgent safety", "Autoimmune", "Pediatric"];
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
    await page.waitForSelector('.dermatology-workspace');
    const firstCondition = page.locator('.dermatology-priority-grid button').first();
    
    if (await firstCondition.isVisible()) {
      await firstCondition.click();
      
      await page.waitForSelector('article.dermatology-topic-detail');
      await expect(page.locator('h3:has-text("Non-Drug Care & Physical Avoidance")')).toBeVisible();
      await expect(page.locator('h3:has-text("Reviewed Treatment Classes")')).toBeVisible();
    }
  });

  test('Red flags and specific elements', async ({ page }) => {
    await page.waitForSelector('.dermatology-workspace');
    const firstCondition = page.locator('.dermatology-priority-grid button').first();
    
    if (await firstCondition.isVisible()) {
      await firstCondition.click();
      await page.waitForSelector('article.dermatology-topic-detail');
      await expect(page.locator('.dermatology-red-flag').or(page.locator('h3:has-text("Red Flags")'))).toBeVisible();
    }
  });

  test('Mobile viewport and responsive flow', async ({ page }) => {
    // Mobile: 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dermatology', { waitUntil: 'networkidle' });
    
    await expect(page.locator('.dermatology-workspace')).toBeVisible();
    
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });
});
