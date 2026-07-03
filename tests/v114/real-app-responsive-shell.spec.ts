import { expect, test, type Page } from "@playwright/test";
import { loginAsOwner } from "../v094/helpers";

const viewports = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
];

test.describe("v0.11.4 real app responsive shell", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  for (const viewport of viewports) {
    for (const path of ["/dashboard", "/prescriptions"]) {
      test(`${path} is stable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        const errors = trackConsoleErrors(page);
        await page.setViewportSize(viewport);
        await page.goto(path);
        await expect(page.locator("body")).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await expectNoHydrationOverlay(page);
        await expectHeadingNearTop(page, path);
        await expectNavigationContained(page);

        if (path === "/dashboard") {
          const searchHeight = await page.locator(".portal-search").first().evaluate((node) => node.getBoundingClientRect().height);
          expect(searchHeight).toBeLessThan(220);
        }
        expect(errors, errors.join("\n")).toEqual([]);
      });
    }
  }

  test("resizing between desktop and phone keeps layout stable", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoHorizontalOverflow(page);
    await expectHeadingNearTop(page, "/dashboard");
    await expectNavigationContained(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expectNoHorizontalOverflow(page);
    await expectNavigationContained(page);
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
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

async function expectHeadingNearTop(page: Page, path: string) {
  const heading = page.getByRole("heading", { name: path === "/prescriptions" ? /prescriptions/i : /clinic home|clinic apps|clinic command|front desk home|daily finance|good morning/i }).first();
  await expect(heading).toBeVisible();
  const box = await heading.boundingBox();
  expect(box?.y ?? 9999).toBeLessThan(path === "/prescriptions" ? 260 : 320);
}

async function expectNavigationContained(page: Page) {
  const navBoxes = await page.locator(".nav-item").evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: window.innerWidth, height: window.innerHeight };
    })
  );
  for (const box of navBoxes) {
    if (box.right <= 0 || box.left >= box.width || box.bottom <= 0 || box.top >= box.height) continue;
    expect(box.left).toBeGreaterThanOrEqual(-2);
    expect(box.right).toBeLessThanOrEqual(box.width + 2);
  }
}

async function expectNoHydrationOverlay(page: Page) {
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/hydration|__gcrremoteframetoken|did not match/i);
}
