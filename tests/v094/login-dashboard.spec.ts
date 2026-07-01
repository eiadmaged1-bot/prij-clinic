import { expect, test } from "@playwright/test";
import { checkVisibleTextOrSoftWarn, expectCleanPage, loginAsOwner } from "./helpers";

test.describe("v0.9.4 login and dashboard browser QA", () => {
  test("login renders cleanly and owner reaches dashboard", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /prij clinic|sign in/i }).first()).toBeVisible();
    await expect(page.getByText(/local demo/i).first()).toBeVisible();
    await expectCleanPage(page);

    await loginAsOwner(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/owner/i).first()).toBeVisible();
    await checkVisibleTextOrSoftWarn(page, /prij clinic/i);
    await checkVisibleTextOrSoftWarn(page, /owner control|users and roles|medication review/i);
    await expectCleanPage(page);
  });
});
