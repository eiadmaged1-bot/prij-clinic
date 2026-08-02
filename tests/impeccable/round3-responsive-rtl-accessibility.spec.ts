import { expect, test, type Page, type TestInfo } from "@playwright/test";

const login = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_OWNER_LOGIN;
const password = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_OWNER_PASSWORD;

if (!login || !password) {
  throw new Error("Synthetic CI login credentials are required for Impeccable Round 3.");
}

test.describe.serial("Impeccable Round 3 — responsive, RTL, and accessibility", () => {
  test("keeps the focused three-stage visit usable across tablet, mobile, RTL, zoom, contrast, and reduced motion", async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.setViewportSize({ width: 1024, height: 768 });
    await signIn(page);
    consoleErrors.length = 0;

    const patient = await createSyntheticPatient(page);
    await openClassicVisit(page, patient.id);
    await openCockpit(page);
    await expectFocusedVisit(page, patient.name);

    await capture(page, testInfo, "01-tablet-focused-visit.png");
    await expectNoWholePageOverflow(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectFocusedVisit(page, patient.name);
    await expect(page.locator("aside.sidebar")).toBeHidden();
    await capture(page, testInfo, "02-mobile-english.png");
    await expectNoWholePageOverflow(page);

    await setLanguage(page, "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("tab", { name: /ملاحظات الزيارة/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /الطلبات والخطة/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /المراجعة/ })).toBeVisible();
    await capture(page, testInfo, "03-mobile-arabic-rtl.png");
    await expectNoWholePageOverflow(page);

    const rtlTabs = page.getByRole("tablist", { name: /مراحل الزيارة/ }).getByRole("tab");
    await rtlTabs.nth(0).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(rtlTabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(rtlTabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(rtlTabs.nth(2)).toHaveAttribute("aria-selected", "true");

    await setLanguage(page, "en");
    await page.setViewportSize({ width: 1024, height: 768 });
    const tabs = page.getByRole("tablist", { name: /Visit workflow/i }).getByRole("tab");
    await expect(tabs).toHaveCount(3);
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");

    await page.setViewportSize({ width: 720, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect(page.getByRole("heading", { name: patient.name })).toBeVisible();
    await capture(page, testInfo, "04-two-hundred-percent-text-reflow.png");
    await expectNoWholePageOverflow(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "no-preference" });
    await expectFocusedVisit(page, patient.name);
    await capture(page, testInfo, "05-forced-colors.png");
    await expectNoWholePageOverflow(page);

    await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
    const motion = await tabs.nth(0).evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        animationDuration: style.animationDuration,
        transitionDuration: style.transitionDuration
      };
    });
    expect(maxCssTimeSeconds(motion.animationDuration)).toBeLessThanOrEqual(0.001);
    expect(maxCssTimeSeconds(motion.transitionDuration)).toBeLessThanOrEqual(0.001);
    await capture(page, testInfo, "06-reduced-motion.png");
    await expectNoWholePageOverflow(page);

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });
});

async function expectFocusedVisit(page: Page, patientName: string) {
  await expect(page.getByRole("heading", { name: patientName })).toBeVisible({ timeout: 25_000 });
  const workflow = page.getByRole("tablist", { name: /Visit workflow|مراحل الزيارة/i });
  await expect(workflow).toBeVisible();
  await expect(workflow.getByRole("tab")).toHaveCount(3);
  await expect(page.locator("aside.sidebar")).toBeHidden();
}

async function setLanguage(page: Page, language: "en" | "ar") {
  await page.evaluate((nextLanguage) => {
    localStorage.setItem("prijClinicLanguage", nextLanguage);
  }, language);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", language === "ar" ? "ar" : "en");
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const switchAccount = page.getByRole("button", { name: /log out and switch account/i });
  if (await switchAccount.isVisible().catch(() => false)) await switchAccount.click();

  await page.getByLabel(/staff id or email/i).fill(login!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(dashboard|owner-control|doctor|reception)(?:$|[/?#])/, { timeout: 20_000 });
}

async function createSyntheticPatient(page: Page) {
  await page.goto("/patients/new");
  await expect(page.getByRole("heading", { name: /^New Patient$/i })).toBeVisible();

  const suffix = String(Date.now()).slice(-7);
  const patientName = `QA Responsive${suffix}`;
  await page.getByLabel(/full name/i).fill(patientName);
  await page.getByLabel(/phone number/i).fill(`010${suffix}`);
  await page.getByRole("button", { name: /save file only/i }).click();

  const openProfile = page.getByRole("link", { name: /open reception profile/i });
  await expect(openProfile).toBeVisible({ timeout: 25_000 });
  await openProfile.click();
  await page.waitForURL(/\/patients\/(?!new(?:$|[/?#])|import(?:$|[/?#]))[^/?#]+(?:$|[/?#])/, { timeout: 25_000 });

  const patientId = page.url().match(/\/patients\/([^/?#]+)/)?.[1];
  if (!patientId || ["import", "new"].includes(patientId)) {
    throw new Error(`Patient creation did not return a canonical patient workspace: ${page.url()}`);
  }
  return { id: patientId, name: patientName };
}

async function openClassicVisit(page: Page, patientId: string) {
  const clinicalCare = page.getByRole("button", { name: /^Clinical care$/i });
  await expect(clinicalCare).toBeVisible({ timeout: 25_000 });
  await clinicalCare.click();

  const visitPanel = page.locator('[aria-label="Current visit clinical workspace"]');
  await expect(visitPanel).toBeVisible();
  await visitPanel.getByRole("button", { name: /open current visit/i }).click();
  await page.waitForURL(new RegExp(`/patients/${patientId}/visits/[^/]+/encounter(?:$|[/?#])`), { timeout: 25_000 });
}

async function openCockpit(page: Page) {
  const options = page.locator(".patient-visit-identity-bar .filter-drawer > summary");
  await expect(options).toBeVisible({ timeout: 25_000 });
  await options.click();
  await page.getByRole("button", { name: /Open Visit Cockpit/i }).click();
  await expect(page.getByRole("tablist", { name: /Visit workflow/i })).toBeVisible({ timeout: 25_000 });
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(name), fullPage: true });
}

async function expectNoWholePageOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    rootScrollWidth: document.documentElement.scrollWidth,
    rootClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));
  expect(metrics.rootScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.rootClientWidth + 2);
  expect(metrics.bodyScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.rootClientWidth + 2);
}

function maxCssTimeSeconds(value: string) {
  return Math.max(...value.split(",").map((part) => {
    const token = part.trim();
    if (token.endsWith("ms")) return Number.parseFloat(token) / 1000;
    if (token.endsWith("s")) return Number.parseFloat(token);
    return 0;
  }));
}
