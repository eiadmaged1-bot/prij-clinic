import { expect, test } from "@playwright/test";
import {
  checkVisibleTextOrSoftWarn,
  createDemoPatient,
  expectCleanPage,
  expectNoMedicationCommerceText,
  loginAsAccountant,
  loginAsOwner,
  loginAsReceptionist,
  openPatientWorkspace,
  visibleBodyText
} from "../v094/helpers";

test.describe("v0.12.7 demo candidate browser QA", () => {
  test("owner can login, create a patient, open workspace, and reach visit packet flow", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

    await loginAsOwner(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    const patientId = await createDemoPatient(page);
    await openPatientWorkspace(page, patientId);
    await expect(page.getByRole("button", { name: /start visit/i }).first()).toBeVisible();
    await expectCleanPage(page);

    await page.getByRole("button", { name: /start visit/i }).first().click();
    await expect(page.getByLabel(/doctor visit workflow stepper/i)).toBeVisible();

    for (const label of ["History", "Care Assist", "Encounter", "Prescription", "Investigations", "Follow-up", "Packet"]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }

    await expect(page.getByRole("heading", { name: /prescription draft/i })).toBeVisible();
    await expect(page.getByText(/generic-first/i)).toBeVisible();
    await expect(page.getByText(/dose, frequency, and duration are not auto-filled/i)).toBeVisible();
    await expect(page.getByLabel(/medication safety terminal/i)).toBeVisible();
    await expect(page.getByText(/review required|doctor review required/i).first()).toBeVisible();

    await expect(page.getByText(/requested investigations/i).first()).toBeVisible();
    await expect(page.getByText(/follow-up/i).first()).toBeVisible();
    await expect(page.getByText(/print packet|patient visit packet/i).first()).toBeVisible();

    await expectCleanPage(page);
    await expectNoMedicationCommerceText(page);
    const body = await visibleBodyText(page);
    expect(body).not.toMatch(/safe in pregnancy|category E|recommended drug|best drug|prescribe this/i);
  });

  test("medication safety review page is usable for owner and blocked for front desk or finance roles", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/admin/medication-safety-profiles");
    await expect(page.getByRole("heading", { name: /medication safety profiles/i })).toBeVisible();
    await expect(page.getByText(/import source file/i)).toBeVisible();
    await expect(page.getByText(/medication safety source review/i)).toBeVisible();
    await expectCleanPage(page);

    if (await loginAsReceptionist(page)) {
      await page.goto("/admin/medication-safety-profiles");
      await checkVisibleTextOrSoftWarn(page, /requires Owner or Admin access|not authorized|forbidden|sign in/i);
      await expect(page.getByText(/commit accepted rows/i)).toHaveCount(0);
    }

    if (await loginAsAccountant(page)) {
      await page.goto("/admin/medication-safety-profiles");
      await checkVisibleTextOrSoftWarn(page, /requires Owner or Admin access|not authorized|forbidden|sign in/i);
      await expect(page.getByText(/approve/i)).toHaveCount(0);
    }
  });
});
