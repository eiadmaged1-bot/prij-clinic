import { expect, test, type Page } from "@playwright/test";
import { loginAsOwner } from "../v094/helpers";

const pages = [
  ["/dashboard", /clinic home|clinic apps|clinic command|front desk home|daily finance|good morning/i],
  ["/patients", /patient files/i],
  ["/patients/new", /new patient file/i],
  ["/queue", /queue/i],
  ["/calendar", /doctor calendar|calendar/i],
  ["/prescriptions", /prescriptions/i],
  ["/orders", /orders workspace/i],
  ["/investigations", /investigations/i],
  ["/billing", /invoices, payments, and daily closing/i],
  ["/finance", /invoices, payments, and daily closing/i],
  ["/guidelines", /guideline center|guidelines|clinical guideline center/i],
  ["/protocol-atlas", /protocol atlas/i],
  ["/admin/accounts", /accounts/i],
  ["/admin/appearance", /appearance settings/i]
] as const;

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 }
];

test.describe("v0.12.0 real app clinic workspace", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  for (const viewport of viewports) {
    for (const [path, heading] of pages) {
      test(`${path} loads cleanly at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        const errors = trackConsoleErrors(page);
        await page.setViewportSize(viewport);
        await page.goto(path);
        await expect(page.locator("body")).toBeVisible();
        await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
        await expectMainContentVisible(page);
        await expectNoHorizontalOverflow(page);
        await expectNoHydrationOverlay(page);
        await expectNoRawSensitiveText(page);
        await expectNoFakePatientText(page);
        await expectNavigationNotGiantGrid(page);

        if (path === "/prescriptions") {
          await expect(page.locator("body")).toContainText(/doctor review|required|draft|no autonomous prescribing/i);
        }
        if (path === "/dashboard") {
          await expect(page.locator("body")).not.toContainText(/Appearance Settings/i);
        }
        if (path.includes("drug") || path.includes("medication") || path === "/prescriptions") {
          await expect(page.locator("body")).not.toContainText(/\b(cart|checkout|buy|available stock)\b/i);
        }

        expect(errors, errors.join("\n")).toEqual([]);
      });
    }
  }
});

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function expectMainContentVisible(page: Page) {
  const box = await page.locator(".app-main").first().boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(200);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.clientWidth + 2);
  expect(overflow.bodyScrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

async function expectNoHydrationOverlay(page: Page) {
  await expect(page.locator("body")).not.toContainText(/hydration|did not match|__gcrremoteframetoken/i);
}

async function expectNoRawSensitiveText(page: Page) {
  await expect(page.locator("body")).not.toContainText(/Prisma|JWT|DATABASE_URL|API_URL|NEXT_PUBLIC_|schema\.prisma|Bearer\s+[a-z0-9._-]+/i);
}

async function expectNoFakePatientText(page: Page) {
  await expect(page.locator("body")).not.toContainText(/John Doe|Jane Doe|Demo Patient|Sample Patient|Test Patient|0123456789|fake@example|Lorem ipsum/i);
}

async function expectNavigationNotGiantGrid(page: Page) {
  const navMetrics = await page.locator(".sidebar").first().evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height, top: rect.top };
  });
  expect(navMetrics.width).toBeLessThanOrEqual(360);
}
