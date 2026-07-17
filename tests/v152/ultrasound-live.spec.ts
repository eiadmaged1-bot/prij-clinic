import { expect, test } from "@playwright/test";
import { loginAsOwner } from "../v094/helpers";

test.beforeEach(async ({ page }) => loginAsOwner(page));

test("live ultrasound center exposes accurate operational queues on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/ob-ultrasounds");
  await expect(page.getByRole("heading", { name: /ultrasound workspace/i })).toBeVisible();
  for (const label of ["Today", "Drafts", "Needs review", "Signed", "Incomplete", "Amended", "All"]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  for (const label of ["Patient type", "Context", "Doctor / operator", "Branch", "Date"]) {
    await expect(page.locator("label").filter({ hasText: label }).locator("input, select").first()).toBeVisible();
  }

  const queues = await page.evaluate(async () => {
    const request = async (status = "") => {
      const response = await fetch(`/api/backend/ob-ultrasounds?page=1&limit=50${status ? `&status=${status}` : ""}`);
      if (!response.ok) throw new Error(`ultrasound queue ${status || "all"} returned ${response.status}`);
      return response.json() as Promise<{ obUltrasounds?: Array<{ status: string; dataClassification: string }>; pageInfo?: { total: number } }>;
    };
    return { all: await request(), needsReview: await request("needs_review"), signed: await request("signed"), incomplete: await request("incomplete") };
  });
  expect(queues.all.obUltrasounds?.every((scan) => !["TEST", "QUARANTINED"].includes(scan.dataClassification))).toBe(true);
  expect(queues.needsReview.obUltrasounds?.every((scan) => scan.status === "complete_for_review")).toBe(true);
  expect(queues.signed.obUltrasounds?.every((scan) => ["signed", "final"].includes(scan.status))).toBe(true);
  expect(queues.incomplete.obUltrasounds?.every((scan) => scan.status === "draft")).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: /ultrasound workspace/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test("operational scan route opens the editor or reports a truthful empty state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/ob-ultrasounds");
  const open = page.getByRole("link", { name: /open patient ultrasound/i }).first();
  if (!(await open.isVisible().catch(() => false))) {
    await expect(page.getByText(/no scans match/i)).toBeVisible();
    return;
  }
  await open.click();
  await expect(page).toHaveURL(/\/patients\/[^/]+\/ultrasounds\/[^/]+$/);
  await expect(page.getByRole("heading", { name: /ultrasound editor|ultrasound|scan/i }).first()).toBeVisible();
  await expect(page.getByText("Structured findings", { exact: true })).toBeVisible();
  await expect(page.locator("label").filter({ hasText: "Previous signed source scan" }).locator("select")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/CLINIC-RT-UNEXPECTED|Internal Server Error/i);

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
