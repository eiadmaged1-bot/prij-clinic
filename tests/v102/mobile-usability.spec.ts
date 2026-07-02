import { expect, test } from "@playwright/test";
import {
  createDemoPatient,
  expectMobilePageClean,
  expectNoCodeLikeText,
  loginAsOwner,
  loginAsReceptionist,
  visibleBodyText
} from "./helpers";

const mobileProfiles = [
  { name: "iPhone SE width", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: "Pixel width", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }
];

for (const profile of mobileProfiles) {
  test.describe(`v0.10.2 mobile browser QA - ${profile.name}`, () => {
    test.use(profile);

    test("login page mobile renders without horizontal overflow", async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: /prij clinic|sign in/i }).first()).toBeVisible();
      await expectMobilePageClean(page);
    });

    test("dashboard mobile renders without horizontal overflow", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/dashboard");
      await expect(page.getByText(/clinic operations|dashboard|today/i).first()).toBeVisible();
      await expectMobilePageClean(page);
    });

    test("patients list mobile renders", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/patients");
      await expect(page.getByRole("heading", { name: /patient files/i })).toBeVisible();
      await expectMobilePageClean(page);
    });

    test("patient create mobile form renders and fields are usable", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/patients/new");
      await expect(page.getByRole("heading", { name: /new patient file/i })).toBeVisible();
      await page.getByLabel(/first name/i).fill("Mobile");
      await page.getByLabel(/last name/i).fill("BrowserQA");
      await page.getByLabel(/^phone$/i).fill("01000000000");
      await expect(page.getByRole("button", { name: /save and open patient file/i })).toBeVisible();
      await expectMobilePageClean(page);
    });

    test("admin accounts mobile page renders for owner/admin", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/admin/accounts");
      await expect(page.getByRole("heading", { name: "Accounts", exact: true })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Search", exact: true })).toBeVisible();
      await expectMobilePageClean(page);
    });

    test("admin drug-market import page mobile renders blocked official rows status", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/admin/drug-market/import");
      await expect(page.getByRole("heading", { name: /official medication import/i })).toBeVisible();
      await expect(page.getByText(/import blocked|official rows/i).first()).toBeVisible();
      await expectMobilePageClean(page);
    });

    test("guidelines and protocol pages mobile render when available", async ({ page }) => {
      await loginAsOwner(page);
      for (const route of ["/guidelines", "/protocol-atlas"]) {
        await page.goto(route);
        await expect(page.locator("body")).toBeVisible();
        await expectMobilePageClean(page);
      }
    });

    test("patient workspace mobile tabs render for created demo patient", async ({ page }) => {
      await loginAsOwner(page);
      const patientId = await createDemoPatient(page);
      await page.goto(`/patients/${patientId}`);
      await expect(page.getByRole("button", { name: /summary/i }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /timeline/i }).first()).toBeVisible();
      await expectMobilePageClean(page);
    });

    test("no code-like text on key mobile pages", async ({ page }) => {
      await loginAsOwner(page);
      for (const route of ["/dashboard", "/patients", "/patients/new", "/admin/accounts", "/admin/drug-market/import", "/guidelines", "/protocol-atlas"]) {
        await page.goto(route);
        await expectNoCodeLikeText(page);
        await expectMobilePageClean(page);
      }
    });

    test("role visibility remains respected on mobile when receptionist exists", async ({ page }) => {
      const loggedIn = await loginAsReceptionist(page);
      test.skip(!loggedIn, "Seeded receptionist demo login is unavailable.");
      await page.goto("/patients");
      await expect(page.getByText(/patient|registration|queue|calendar/i).first()).toBeVisible();
      const body = await visibleBodyText(page);
      expect(body).not.toMatch(/Admin \/ Owner Control|Users and Roles|Official Medication Import|Medication Ops/i);
      await expectMobilePageClean(page);
    });
  });
}
