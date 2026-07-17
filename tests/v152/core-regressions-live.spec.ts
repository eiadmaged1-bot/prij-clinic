import { expect, test } from "@playwright/test";
import { loginAsOwner } from "../v094/helpers";

test.beforeEach(async ({ page }) => loginAsOwner(page));

test("Patient Directory browses operational records as a desktop table and mobile cards", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/patients");
  await expect(page.getByRole("heading", { name: "All Patients" })).toBeVisible();
  await expect(page.locator(".patient-directory-desktop-table table")).toBeVisible();
  await expect(page.getByText(/patient files · showing/i)).toBeVisible();
  await expect(page.getByLabel("Directory view")).toHaveValue("all");
  const operational = await page.evaluate(async () => {
    const response = await fetch("/api/backend/patients?mode=directory&view=all&page=1&limit=20");
    if (!response.ok) throw new Error(`directory returned ${response.status}`);
    return response.json() as Promise<{ patients?: Array<{ dataClassification?: string }>; pageInfo?: { total: number } }>;
  });
  expect(operational.patients?.every((patient) => !["TEST", "QUARANTINED"].includes(patient.dataClassification ?? "REAL"))).toBe(true);
  expect(operational.pageInfo?.total).toBeGreaterThan(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator(".patient-directory-mobile-list")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test("My Cases remains a subset of All Clinic Cases with explicit scopes", async ({ page }) => {
  await page.goto("/doctor/case-library");
  await expect(page.getByRole("button", { name: "My cases" })).toBeVisible();
  await expect(page.getByRole("button", { name: "All clinic cases" })).toBeVisible();
  const result = await page.evaluate(async () => {
    const readAll = async (scope: "mine" | "all") => {
      const ids: string[] = [];
      for (let pageNumber = 1; pageNumber <= 100; pageNumber += 1) {
        const response = await fetch(`/api/backend/doctor/case-library?scope=${scope}&page=${pageNumber}&limit=50`);
        if (!response.ok) throw new Error(`${scope} cases returned ${response.status}`);
        const body = await response.json() as { cases?: Array<{ id: string }>; pageInfo?: { hasMore: boolean; total: number }; scopeLabel?: string };
        ids.push(...(body.cases ?? []).map((item) => item.id));
        if (!body.pageInfo?.hasMore) return { ids, total: body.pageInfo?.total ?? ids.length, scopeLabel: body.scopeLabel ?? "" };
      }
      throw new Error(`${scope} case pagination exceeded its safety bound`);
    };
    return { mine: await readAll("mine"), all: await readAll("all") };
  });
  const allIds = new Set(result.all.ids);
  expect(result.mine.ids.every((id) => allIds.has(id))).toBe(true);
  expect(result.mine.total).toBeLessThanOrEqual(result.all.total);
  expect(result.mine.scopeLabel).toMatch(/created|owned|started|signed|participated/i);
  expect(result.all.scopeLabel).toMatch(/all permitted clinic cases/i);
});

test("Appearance opens safely on Dr Maged Premium without route crash", async ({ page }) => {
  await page.goto("/admin/appearance");
  await expect(page.getByRole("heading", { name: "Appearance Settings", exact: true })).toBeVisible();
  await expect(page.getByText("Dr Maged Premium", { exact: true }).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Cannot read properties of undefined|CLINIC-RT-UNEXPECTED|Internal Server Error/i);
});
