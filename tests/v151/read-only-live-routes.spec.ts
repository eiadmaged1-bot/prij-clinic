import { expect, test, type Page } from "@playwright/test";
import { loginAsOwner } from "../v094/helpers";

const liveRoutes = [
  "/doctor", "/reception", "/patients", "/doctor/case-library", "/guidelines",
  "/protocol-atlas", "/investigations", "/ob-ultrasounds", "/medications", "/dermatology",
  "/external-intake", "/admin", "/admin/appearance", "/admin/accounts",
  "/admin/services", "/admin/investigations", "/admin/security-readiness",
  "/admin/audit", "/staff-chat"
];

test.beforeEach(async ({ page }) => loginAsOwner(page));

test("repaired production routes render connected authenticated screens on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of liveRoutes) await expectLiveRoute(page, route);
});

test("major repaired routes remain usable at mobile portrait width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/patients", "/guidelines", "/investigations", "/ob-ultrasounds", "/medications", "/dermatology", "/external-intake", "/admin/appearance"]) {
    await expectLiveRoute(page, route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} has page-level horizontal overflow`).toBeLessThanOrEqual(2);
  }
});

test("a stored guideline opens an actual PDF canvas or a truthful explicit fallback", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text().slice(0, 300)); });
  page.on("response", (response) => { if (response.status() >= 400) browserErrors.push(`${response.status()} ${new URL(response.url()).pathname}`); });
  await page.goto("/guidelines");
  const inventory = await page.evaluate(async () => {
    const response = await fetch("/api/backend/guidelines/documents?page=1&limit=50");
    return response.json() as Promise<{ documents?: Array<{ id: string; fileAvailable?: boolean; fileName?: string | null }> }>;
  });
  const storedPdf = inventory.documents?.find((document) => document.fileAvailable && document.fileName?.toLowerCase().endsWith(".pdf"));
  expect(storedPdf, "the preserved library must expose at least one stored PDF asset").toBeTruthy();
  const documentId = storedPdf!.id;
  const href = `/guidelines/${documentId}`;
  const delivery = await page.evaluate(async (id) => {
    const response = await fetch(`/api/backend/guidelines/documents/${encodeURIComponent(id)}/view?acceptance=${Date.now()}`, { credentials: "include", cache: "no-store", headers: { Range: "bytes=0-31" } });
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { status: response.status, type: response.headers.get("content-type"), range: response.headers.get("content-range"), signature: String.fromCharCode(...bytes.slice(0, 5)) };
  }, documentId);
  console.log(`V151_PDF_DELIVERY=${JSON.stringify(delivery)}`);
  const fullDelivery = await page.evaluate(async (id) => {
    const response = await fetch(`/api/backend/guidelines/documents/${encodeURIComponent(id)}/view?acceptance=full-${Date.now()}`, { credentials: "include", cache: "no-store" });
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { status: response.status, type: response.headers.get("content-type"), length: bytes.length, signature: String.fromCharCode(...bytes.slice(0, 5)) };
  }, documentId);
  console.log(`V151_PDF_FULL_DELIVERY=${JSON.stringify(fullDelivery)}`);
  await page.goto(href);
  await expect(page.locator("body")).not.toContainText(/CLINIC-RT-UNEXPECTED|Internal Server Error/i);
  const canvas = page.locator("canvas").first();
  const fallback = page.getByText(/PDF rendering unavailable.+Text fallback mode/i).first();
  await expect(canvas.or(fallback)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Loading authoritative PDF…")).toBeHidden({ timeout: 30_000 });
  if (await canvas.isVisible().catch(() => false)) {
    const dimensions = await canvas.evaluate((element) => ({ width: element.width, height: element.height }));
    expect(dimensions.width).toBeGreaterThan(100);
    expect(dimensions.height).toBeGreaterThan(100);
    console.log(`V151_PDF_RESULT=canvas:${dimensions.width}x${dimensions.height}`);
  } else {
    const reason = await page.getByText(/Renderer error:/i).textContent().catch(() => "reason unavailable");
    console.log(`V151_PDF_RESULT=truthful-fallback reason=${reason} ${JSON.stringify(browserErrors)}`);
  }
});

async function expectLiveRoute(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response?.status() ?? 599, `${route} returned a server error`).toBeLessThan(500);
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator("body")).toBeVisible();
  await expect.poll(async () => (await page.locator("body").innerText()).trim().length, { timeout: 15_000 }).toBeGreaterThan(40);
  const text = (await page.locator("body").innerText()).trim();
  expect(text.length, `${route} rendered an empty shell`).toBeGreaterThan(40);
  expect(text, `${route} rendered a route-level failure`).not.toMatch(/CLINIC-RT-UNEXPECTED|Internal Server Error/i);
}
