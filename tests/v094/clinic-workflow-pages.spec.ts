import { expect, test } from "@playwright/test";
import { expectCleanPage, loginAsOwner, visibleBodyText } from "./helpers";

const workflowRoutes = [
  "/calendar",
  "/appointments",
  "/queue",
  "/doctor",
  "/doctor/visit",
  "/billing",
  "/finance",
  "/orders",
  "/investigations",
  "/reports",
  "/consents"
];

test.describe("v0.9.4 clinic workflow page browser QA", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  for (const route of workflowRoutes) {
    test(`${route} loads as a focused clinic workflow page`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      await expectCleanPage(page);

      const body = await visibleBodyText(page);
      expect(body.length, `${route} should render meaningful visible content`).toBeGreaterThan(80);
      expect(body, `${route} should not repeat a giant unrelated dashboard dump`).not.toMatch(/Clinic Home[\s\S]{0,200}Patient Files[\s\S]{0,200}Medication Review[\s\S]{0,200}Patient file details/i);
    });
  }
});
