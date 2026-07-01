import { expect, test } from "@playwright/test";
import { checkVisibleTextOrSoftWarn, createDemoPatient, expectCleanPage, loginAsOwner, openPatientWorkspace } from "./helpers";

test.describe("v0.9.4 patient creation and workspace browser QA", () => {
  test("owner creates a fake demo patient and opens the workspace", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/patients");
    await expect(page.getByRole("heading", { name: /patient files/i })).toBeVisible();
    await expectCleanPage(page);

    const patientId = await createDemoPatient(page);
    await openPatientWorkspace(page, patientId);
    await expect(page.getByText(/QA BrowserTest/i).first()).toBeVisible();

    for (const requiredTab of [
      "Summary",
      "Medical",
      "Clinical",
      "Appointments",
      "Encounters",
      "Prescriptions",
      "Reports",
      "Pregnancy",
      "Ultrasound",
      "Consents",
      "Medications",
      "Timeline"
    ]) {
      await expect(page.getByRole("button", { name: new RegExp(requiredTab, "i") }).first()).toBeVisible();
    }

    for (const flexibleTab of [
      /Investigations|Orders/i,
      /Billing|Finance/i,
      /AI Drafts|AI Snapshot/i,
      /Protocol Atlas|Guidelines/i,
      /Calculators/i,
      /Allergies/i,
      /Medication Safety/i
    ]) {
      await checkVisibleTextOrSoftWarn(page, flexibleTab);
    }

    await expectCleanPage(page);
  });
});
