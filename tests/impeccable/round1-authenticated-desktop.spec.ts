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
    await capture(page, testInfo, "01-dashboard-desktop.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    await page.goto("/patients");
    await expect(page.locator("body")).toBeVisible();
    await capture(page, testInfo, "02-patient-files-desktop.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    const patientId = await openOrCreateSyntheticPatient(page);
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}(?:$|[/?#])`));
    await capture(page, testInfo, "03-patient-file-desktop.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    await openActiveVisit(page);
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

async function openOrCreateSyntheticPatient(page: Page) {
  const firstPatientLink = page.locator('a[href^="/patients/"]').filter({ hasNot: page.locator('[href="/patients/new"]') }).first();
  if (await firstPatientLink.isVisible().catch(() => false)) {
    const href = await firstPatientLink.getAttribute("href");
    await firstPatientLink.click();
    const patientId = href?.match(/^\/patients\/([^/?#]+)/)?.[1];
    if (!patientId) throw new Error(`Could not resolve patient ID from ${href}`);
    return patientId;
  }

  await page.goto("/patients/new");
  await expect(page.getByRole("heading", { name: /new patient file/i })).toBeVisible();
  const suffix = String(Date.now()).slice(-7);
  await page.getByLabel(/first name/i).fill("QA");
  await page.getByLabel(/last name/i).fill(`Impeccable${suffix}`);
  await page.getByLabel(/^phone$/i).fill(`010${suffix}`);
  const notes = page.getByLabel(/notes/i);
  if (await notes.isVisible().catch(() => false)) {
    await notes.fill("Synthetic GitHub Actions browser QA patient. No real patient data.");
  }
  await page.getByRole("button", { name: /save and open patient file/i }).click();
  await page.waitForURL(/\/patients\/(?!new(?:$|[/?#]))[^/?#]+(?:$|[/?#])/, { timeout: 25_000 });
  const patientId = page.url().match(/\/patients\/(?!new(?:$|[/?#]))([^/?#]+)/)?.[1];
  if (!patientId) throw new Error(`Patient creation did not return a patient workspace: ${page.url()}`);
  return patientId;
}

async function openActiveVisit(page: Page) {
  const action = page.getByRole("button", { name: /start visit|resume visit|open current visit/i }).first();
  if (await action.isVisible().catch(() => false)) {
    await action.click();
  } else {
    const actionLink = page.getByRole("link", { name: /start visit|resume visit|current visit|open visit/i }).first();
    if (await actionLink.isVisible().catch(() => false)) {
      await actionLink.click();
    } else {
      const visitLink = page.locator('a[href*="/visits/"]').first();
      await expect(visitLink, "Expected a start/resume/current-visit action or an existing visit link").toBeVisible();
      await visitLink.click();
    }
  }

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
