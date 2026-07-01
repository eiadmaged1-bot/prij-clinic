import { test } from "@playwright/test";
import { expectCleanPage, expectNoMedicationCommerceText, loginAsOwner } from "./helpers";

const normalMedicationRoutes = [
  "/medications",
  "/medications/search",
  "/medications/families",
  "/medications/herbals",
  "/medications/safety",
  "/drug-market",
  "/drug-market/search"
];

const adminMedicationRoutes = [
  "/admin/drug-market",
  "/admin/drug-market/coverage",
  "/admin/drug-market/automation",
  "/admin/drug-market/review-queue"
];

test.describe("v0.9.4 medication and drug-market browser QA", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  for (const route of normalMedicationRoutes) {
    test(`${route} avoids commerce, dosing, raw source, and debug clutter`, async ({ page }) => {
      await page.goto(route);
      await expectCleanPage(page);
      await expectNoMedicationCommerceText(page);
    });
  }

  for (const route of adminMedicationRoutes) {
    test(`${route} avoids purchasing behavior and secret exposure`, async ({ page }) => {
      await page.goto(route);
      await expectNoMedicationCommerceText(page);
      await expectCleanPage(page);
    });
  }
});
