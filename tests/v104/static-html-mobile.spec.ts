import { spawn, type ChildProcess } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const viewports = [
  { width: 360, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 }
];

const sections = [
  "Dashboard",
  "Login Preview",
  "Patients",
  "Patient File",
  "Doctor Workspace",
  "Calendar",
  "Queue",
  "Prescriptions",
  "Investigations",
  "Billing",
  "Admin",
  "Appearance",
  "Drug Market",
  "Guidelines",
  "Protocol Atlas",
  "Theme Gallery"
];

let server: ChildProcess | undefined;
let baseURL = "http://localhost:4174";

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("Static HTML lab server did not start");
}

async function expectNoHorizontalOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.innerWidth + 2);
}

async function openSection(page: Page, section: string) {
  const menu = page.getByRole("button", { name: "Menu" });
  await menu.click();
  await page.locator(".nav-item", { hasText: section }).click();
}

test.beforeAll(async () => {
  server = spawn("node", ["scripts/v104-serve-static-html-lab.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stdout?.on("data", (chunk) => {
    const text = String(chunk);
    const match = text.match(/Local:\s+(http:\/\/localhost:\d+)/);
    if (match) baseURL = match[1];
  });
  await waitForServer();
});

test.afterAll(() => {
  server?.kill();
});

for (const viewport of viewports) {
  test(`static lab is mobile-stable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("requestfailed", (request) => consoleErrors.push(`request failed: ${request.url()}`));

    await page.setViewportSize(viewport);
    await page.goto(baseURL, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.locator("[data-section='dashboard'] [data-theme-target]")).toHaveCount(0);
    await expect(page.locator(".main > [aria-label='Lab controls']")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    expect(consoleErrors).toEqual([]);

    const menu = page.getByRole("button", { name: "Menu" });
    await menu.click();
    await expect(page.locator("[data-drawer]")).toHaveClass(/open/);
    await page.locator("[data-drawer-overlay]").click({ position: { x: viewport.width - 8, y: 24 } });
    await expect(page.locator("[data-drawer]")).not.toHaveClass(/open/);

    await menu.click();
    await page.locator("[data-section-target='patients'].nav-item").click();
    await expect(page.locator("[data-drawer]")).not.toHaveClass(/open/);
    await expect(page.getByRole("heading", { name: "Patients" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    for (const section of sections) {
      await menu.click();
      await page.locator(".nav-item", { hasText: section }).click();
      await expect(page.locator("[data-section].active")).toHaveAttribute("aria-label", section);
      await expect(page.locator("[data-drawer]")).not.toHaveClass(/open/);
      await expectNoHorizontalOverflow(page);
    }

    await openSection(page, "Login Preview");
    await expect(page.getByRole("heading", { name: "Staff sign in" })).toBeVisible();
    await page.getByRole("button", { name: "Enter UI Lab" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await openSection(page, "Appearance");
    await expect(page.locator("[data-section='appearance']")).toContainText("Choose a static UI theme for review. This changes the visual preview only.");
    await page.locator("[data-section='appearance'] [data-theme-target='dark-navy']").click();
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark-navy");
    await expect(page.locator("[data-section='appearance'] [data-theme-target='dark-navy']")).toHaveAttribute("data-theme-active", "true");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark-navy");
    await expect(page.locator("[data-section='appearance'] [data-theme-target='dark-navy']")).toHaveAttribute("data-theme-active", "true");
    await expectNoHorizontalOverflow(page);

    await openSection(page, "Patient File");
    await page.getByLabel("Patient file tabs").getByRole("button", { name: "Investigations" }).click();
    await expect(page.locator("[data-tab-panel='investigations']")).toBeVisible();

    await openSection(page, "Prescriptions");
    await expect(page.locator("[data-section='prescriptions']")).not.toContainText(/dose automation|auto.*dose|frequency|duration|route/i);

    await openSection(page, "Drug Market");
    await expect(page.locator("[data-section='drug-market']")).not.toContainText(/\b(stock|cart|checkout|buy|purchase)\b/i);

    await expect(page.locator("body")).not.toContainText(/\/api\/|jwt|prisma|endpoint|schema|raw json|database/i);

    const brokenImages = await page.evaluate(async () => {
      const images = [...document.images];
      await Promise.all(images.map((image) => image.complete ? undefined : new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      })));
      return images.filter((image) => image.naturalWidth === 0).map((image) => image.currentSrc || image.src);
    });
    expect(brokenImages).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
