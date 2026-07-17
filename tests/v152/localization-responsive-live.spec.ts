import { expect, test } from "@playwright/test";
import { loginAsOwner } from "../v094/helpers";

test.setTimeout(180_000);

test.beforeEach(async ({ page }) => {
  await loginAsOwner(page);
  await page.getByLabel("Current account").getByRole("button").first().click();
  await page.getByRole("button", { name: "عربي", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
});

test("patient directory and ultrasound center render translated RTL controls", async ({ page }) => {
  await openRoute(page, "/patients");
  await expect(page.getByRole("heading", { name: "كل المريضات" })).toBeVisible();
  await expect(page.getByLabel("عرض الدليل")).toBeVisible();
  await expect(page.getByRole("button", { name: "مسح عوامل التصفية" })).toBeVisible();

  await openRoute(page, "/ob-ultrasounds");
  await expect(page.getByRole("heading", { name: "مساحة عمل السونار" })).toBeVisible();
  await expect(page.getByLabel("قوائم عمل الموجات فوق الصوتية")).toBeVisible();
  await expect(page.getByText("نوع المريضة", { exact: true })).toBeVisible();
});

test("major localized clinical routes remain bounded across required viewports", async ({ page }) => {
  const routes = [
    ["/patients", "كل المريضات"],
    ["/ob-ultrasounds", "مساحة عمل السونار"],
    ["/dermatology", "موضوع معرفي في الأمراض الجلدية"]
  ] as const;
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 844, height: 390 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const [route, heading] of routes) {
      await openRoute(page, route);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(2);
      await expect(page.locator("body")).not.toContainText(/\?\?\?\?|Ø|Ù|Ã|�/);
    }
  }
});

async function openRoute(page: import("@playwright/test").Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" }).catch(async () => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
  });
}
