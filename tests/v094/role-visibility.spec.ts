import { expect, test, type Page } from "@playwright/test";
import {
  expectCleanPage,
  loginAsAccountant,
  loginAsDoctor,
  loginAsNurse,
  loginAsOwner,
  loginAsReceptionist,
  visibleBodyText
} from "./helpers";

const forbiddenOwnerRoutes = [
  "/admin",
  "/admin/drug-market/automation",
  "/admin/drug-market/review-queue"
];

test.describe("v0.9.4 role visibility browser QA", () => {
  test("owner can see owner/admin medication controls", async ({ page }) => {
    await loginAsOwner(page);
    for (const route of ["/admin", "/admin/drug-market", "/admin/drug-market/automation", "/admin/drug-market/coverage", "/admin/drug-market/review-queue"]) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText(/owner|admin|review|coverage|automation/i).first()).toBeVisible();
      await expectCleanPage(page);
    }
  });

  test("doctor role sees clinical workspace without owner-only controls", async ({ page }) => {
    test.skip(!(await loginAsDoctor(page)), "Seeded doctor demo login is unavailable.");
    await page.goto("/doctor");
    await expect(page.getByText(/doctor|visit|queue|patient/i).first()).toBeVisible();
    await expectNoOwnerControls(page, "/doctor");
  });

  test("receptionist role cannot see owner/admin tools", async ({ page }) => {
    test.skip(!(await loginAsReceptionist(page)), "Seeded receptionist demo login is unavailable.");
    await page.goto("/patients");
    await expect(page.getByText(/patient|reception|queue|calendar/i).first()).toBeVisible();
    await expectNoOwnerControls(page, "/patients");
    await expectForbiddenRoutesStayHidden(page, forbiddenOwnerRoutes);
  });

  test("accountant role can see finance but not clinical AI or admin import tools", async ({ page }) => {
    test.skip(!(await loginAsAccountant(page)), "Seeded accountant demo login is unavailable.");
    await page.goto("/finance");
    await expect(page.getByText(/finance|billing|payment|invoice/i).first()).toBeVisible();
    await expectNoOwnerControls(page, "/finance");
    await expectForbiddenRoutesStayHidden(page, ["/admin/drug-market/automation", "/admin/drug-market/review-queue", "/medications/safety", "/guidelines", "/protocol-atlas", "/ai-drafts"]);
  });

  test("nurse role is checked when seeded and cannot see owner controls", async ({ page }) => {
    test.skip(!(await loginAsNurse(page)), "Seeded nurse demo login is unavailable.");
    await page.goto("/queue");
    await expect(page.getByText(/queue|patient|clinic/i).first()).toBeVisible();
    await expectNoOwnerControls(page, "/queue");
    await expectForbiddenRoutesStayHidden(page, forbiddenOwnerRoutes);
  });
});

async function expectNoOwnerControls(page: Page, context: string) {
  const body = await visibleBodyText(page);
  expect(body, `${context} exposed owner-only navigation`).not.toMatch(/Owner Control|Owner Home|Users and Roles|Medication Review|Medication Ops|Appearance/i);
}

async function expectForbiddenRoutesStayHidden(page: Page, routes: string[]) {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    await expectNoOwnerControls(page, route);
  }
}
