import { expect, test, type Page } from "@playwright/test";
import { loginAsDoctor, loginAsOwner, loginAsReceptionist } from "../v094/helpers";

const viewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 }
];

const roles = [
  { name: "owner", login: loginAsOwner, path: "/dashboard", heading: /clinic home|clinic apps|clinic command|today/i },
  { name: "doctor", login: loginAsDoctor, path: "/doctor", heading: /today’s clinical work/i },
  { name: "receptionist", login: loginAsReceptionist, path: "/reception", heading: /reception|front desk/i }
] as const;

for (const role of roles) {
  test.describe(`${role.name} desktop workspace`, () => {
    for (const viewport of viewports) {
      test(`${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const loggedIn = await role.login(page);
        test.skip(loggedIn === false, `${role.name} QA account is unavailable.`);

        const consoleErrors = trackErrors(page);
        await page.goto(role.path);
        await expect(page.getByRole("heading", { name: role.heading }).first()).toBeVisible();
        await expect(page.locator(".account-menu")).toBeVisible();
        await expect(page.locator(".sidebar")).toBeVisible();
        const overlayText = await page.evaluate(() => Array.from(document.querySelectorAll("nextjs-portal"))
          .map((portal) => portal.shadowRoot?.textContent ?? "")
          .join(" "));
        expect(overlayText).not.toMatch(/Unhandled|Build Error|Application error|stack trace/i);

        const geometry = await page.evaluate(() => {
          const root = document.documentElement;
          const sidebar = document.querySelector<HTMLElement>(".sidebar")?.getBoundingClientRect();
          const main = document.querySelector<HTMLElement>(".app-main")?.getBoundingClientRect();
          return {
            rootWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            bodyScrollWidth: document.body.scrollWidth,
            sidebar: sidebar ? { left: sidebar.left, right: sidebar.right, width: sidebar.width } : null,
            main: main ? { left: main.left, right: main.right, width: main.width } : null
          };
        });

        expect(geometry.scrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.rootWidth + 2);
        expect(geometry.bodyScrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.rootWidth + 2);
        expect(geometry.sidebar?.width ?? 0).toBeGreaterThanOrEqual(239);
        expect(geometry.sidebar?.width ?? 999).toBeLessThanOrEqual(261);
        expect(geometry.main?.left ?? 0).toBeGreaterThanOrEqual((geometry.sidebar?.right ?? 0) - 2);
        expect(geometry.main?.right ?? viewport.width).toBeLessThanOrEqual(viewport.width + 2);
        expect(geometry.main?.width ?? 0).toBeGreaterThan(700);

        const compactCards = page.locator(".compact-kpi-card, .metric-card, .compact-action-card");
        if (await compactCards.count()) {
          const heights = await compactCards.evaluateAll((nodes) => nodes.slice(0, 8).map((node) => node.getBoundingClientRect().height));
          expect(Math.max(...heights)).toBeLessThanOrEqual(113);
        }

        expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
      });
    }
  });
}

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}
