import { expect, test, type Page, type TestInfo } from "@playwright/test";

const login = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_OWNER_LOGIN;
const password = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_OWNER_PASSWORD;

if (!login || !password) {
  throw new Error("Synthetic CI login credentials are required for Impeccable Round 1.");
}

test.describe.serial("Impeccable Round 1 — authenticated desktop smoke", () => {
  test("captures dashboard, patient file, and active Classic workspace", async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);
    consoleErrors.length = 0;

    await expect(page.getByRole("heading", { name: /owner control center|dashboard|doctor workspace|reception/i }).first()).toBeVisible({ timeout: 25_000 });
    await capture(page, testInfo, "01-dashboard-desktop.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    await page.goto("/patients");
    await expect(page.getByRole("heading", { name: /^Patient Files$/i })).toBeVisible({ timeout: 25_000 });
    await capture(page, testInfo, "02-patient-files-desktop.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    const patient = await createSyntheticPatient(page);
    await expect(page).toHaveURL(new RegExp(`/patients/${patient.id}(?:$|[/?#])`));
    await expect.poll(async () => {
      const matches = page.getByText(patient.name, { exact: true });
      const count = await matches.count();
      for (let index = 0; index < count; index += 1) {
        if (await matches.nth(index).isVisible().catch(() => false)) return true;
      }
      return false;
    }, { timeout: 25_000, message: `Expected visible patient identity for ${patient.name}` }).toBe(true);
    await capture(page, testInfo, "03-patient-file-desktop.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    await openActiveVisit(page, patient.id);
    await expect(page.locator("body")).toContainText(/Classic Workspace|Current Visit|Encounter|Visit Workspace/i);
    await capture(page, testInfo, "04-classic-workspace-desktop.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });
});

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
  await expect(page.locator("body")).toBeVisible();
}

async function createSyntheticPatient(page: Page) {
  await page.goto("/patients/new");
  await expect(page.getByRole("heading", { name: /^New Patient$/i })).toBeVisible();

  const suffix = String(Date.now()).slice(-7);
  const patientName = `QA Impeccable${suffix}`;
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

async function openActiveVisit(page: Page, patientId: string) {
  await expect(page.getByRole("button", { name: /^Visits$/i })).toBeVisible();
  await page.getByRole("button", { name: /^Visits$/i }).click();

  const visitPanel = page.locator('[aria-label="Current visit clinical workspace"]');
  await expect(visitPanel).toBeVisible();

  const openVisit = visitPanel.getByRole("button", { name: /open current visit/i });
  await expect(openVisit).toBeVisible();
  await openVisit.click();

  await page.waitForURL(new RegExp(`/patients/${patientId}/visits/[^/]+/encounter(?:$|[/?#])`), { timeout: 25_000 });
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("body")).toBeVisible();
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

async function expectNoCrashText(page: Page) {
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  expect(text).not.toMatch(/Unhandled Runtime Error|Application error|TypeError:|ReferenceError:|ECONNREFUSED|Internal Server Error/i);
  expect(text).not.toMatch(/DATABASE_URL|JWT_SECRET|schema\.prisma|Bearer\s+[a-z0-9._-]+/i);
}
