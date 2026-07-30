import { expect, test, type Page, type TestInfo } from "@playwright/test";

const login = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_OWNER_LOGIN;
const password = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_OWNER_PASSWORD;

if (!login || !password) {
  throw new Error("Synthetic CI login credentials are required for Impeccable Round 2.");
}

test.describe.serial("Impeccable Round 2 — shared encounter lifecycle", () => {
  test("persists one encounter across Classic and Cockpit, gates Review, signs, and becomes read-only", async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);
    consoleErrors.length = 0;

    const patient = await createSyntheticPatient(page);
    await openClassicVisit(page, patient.id);
    const encounterId = encounterIdFromUrl(page.url());

    await expect(page.getByRole("link", { name: /^Visit note$/i })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByLabel(/^Current visit section$/i)).toHaveValue("encounter");

    const values = {
      complaint: `Round 2 complaint ${Date.now()}`,
      history: "Structured lifecycle QA history recorded by the doctor.",
      examination: "Patient clinically stable during the synthetic QA examination.",
      assessment: "Synthetic assessment for shared encounter verification.",
      plan: "Synthetic reviewed plan for persistence and signing verification."
    };

    await page.getByLabel(/^Doctor plan$/i).fill(values.plan);
    await page.getByLabel(/^Chief complaint$/i).fill(values.complaint);
    await page.getByLabel(/^History$/i).fill(values.history);
    await page.getByLabel(/^Examination$/i).fill(values.examination);
    await page.getByLabel(/^Impression$/i).fill(values.assessment);
    await page.getByRole("button", { name: /^Save draft$/i }).click();
    await expect(page.getByText(/^Saved$/i).first()).toBeVisible({ timeout: 25_000 });
    await capture(page, testInfo, "01-classic-saved-draft.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    await openCockpit(page);
    await expect(page.getByRole("heading", { name: patient.name })).toBeVisible({ timeout: 25_000 });

    await page.getByRole("tab", { name: /^History/i }).click();
    await expect(page.getByLabel(/^Required complaint$/i)).toHaveValue(values.complaint);
    await expect(page.getByLabel(/^Additional History notes$/i)).toHaveValue(values.history);

    await page.getByRole("tab", { name: /^Plan/i }).click();
    await expect(page.getByLabel(/^Plan notes$/i)).toHaveValue(values.plan);
    await capture(page, testInfo, "02-cockpit-shared-persistence.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    await page.getByRole("tab", { name: /^Review/i }).click();
    await expect(page.getByRole("heading", { name: /^Blocking issues$/i })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(/menstrual or reproductive status/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign and finish encounter/i })).toBeDisabled();
    await capture(page, testInfo, "03-review-blocked.png");

    await setReviewedReproductiveStatus(page, patient.id, encounterId);
    await page.reload();
    await expect(page.getByRole("heading", { name: patient.name })).toBeVisible({ timeout: 25_000 });
    await page.getByRole("tab", { name: /^Review/i }).click();
    const recheck = page.getByRole("button", { name: /Recheck readiness/i });
    if (await recheck.isVisible().catch(() => false)) await recheck.click();
    const sign = page.getByRole("button", { name: /Sign and finish encounter/i });
    await expect(sign).toBeEnabled({ timeout: 25_000 });
    await expect(page.getByText(values.complaint, { exact: true })).toBeVisible();
    await expect(page.getByText(values.plan, { exact: true })).toBeVisible();
    await capture(page, testInfo, "04-review-ready.png");

    await sign.click();
    await expect(page.getByText(/Completed encounter · read-only/i)).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("button", { name: /Sign and finish encounter/i })).toHaveCount(0);
    await expect(page.locator("textarea:enabled, input:enabled")).toHaveCount(0);
    await capture(page, testInfo, "05-signed-read-only.png");
    await expectNoCrashText(page);
    await expectNoWholePageOverflow(page);

    const signedPacket = await readPacket(page, patient.id, encounterId);
    expect(signedPacket.encounter?.id).toBe(encounterId);
    expect(signedPacket.encounter?.status).toBe("signed");
    expect(signedPacket.encounter?.chiefComplaint).toBe(values.complaint);
    expect(signedPacket.encounter?.planText).toBe(values.plan);

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
  const patientName = `QA Lifecycle${suffix}`;
  await page.getByLabel(/full name/i).fill(patientName);
  await page.getByLabel(/phone number/i).fill(`011${suffix}`);
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
  await expect(page.getByRole("link", { name: /^Visit note$/i })).toBeVisible({ timeout: 25_000 });
}

async function openCockpit(page: Page) {
  const options = page.locator("summary").filter({ hasText: /^Options$/i }).first();
  await expect(options).toBeVisible();
  await options.click();
  await page.getByRole("button", { name: /Open Visit Cockpit/i }).click();
  await expect(page.getByRole("tablist", { name: /Visit stages/i })).toBeVisible({ timeout: 25_000 });
}

async function setReviewedReproductiveStatus(page: Page, patientId: string, encounterId: string) {
  const result = await page.evaluate(async ({ patientId: resolvedPatientId, encounterId: resolvedEncounterId }) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const prefix = "/api/backend";
    const packetResponse = await fetch(`${prefix}/patients/${encodeURIComponent(resolvedPatientId)}/doctor-visit/${encodeURIComponent(resolvedEncounterId)}/packet`, { credentials: "include", headers });
    const packet = await packetResponse.json();
    if (!packetResponse.ok) return { ok: false, status: packetResponse.status, body: packet };
    const encounter = packet.encounter ?? {};
    const examinationJson = encounter.examinationJson && typeof encounter.examinationJson === "object" ? encounter.examinationJson : {};
    const response = await fetch(`${prefix}/patients/${encodeURIComponent(resolvedPatientId)}/doctor-visit/${encodeURIComponent(resolvedEncounterId)}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({
        revision: encounter.updatedAt,
        examinationJson: {
          ...examinationJson,
          reproductiveSnapshot: {
            context: "general",
            changeStatus: "reviewed"
          }
        }
      })
    });
    return { ok: response.ok, status: response.status, body: await response.json().catch(() => null) };
  }, { patientId, encounterId });

  expect(result.ok, JSON.stringify(result)).toBe(true);
}

async function readPacket(page: Page, patientId: string, encounterId: string) {
  return page.evaluate(async ({ patientId: resolvedPatientId, encounterId: resolvedEncounterId }) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = {};
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`/api/backend/patients/${encodeURIComponent(resolvedPatientId)}/doctor-visit/${encodeURIComponent(resolvedEncounterId)}/packet`, { credentials: "include", headers });
    if (!response.ok) throw new Error(`Packet read failed with ${response.status}`);
    return response.json();
  }, { patientId, encounterId }) as Promise<{ encounter?: Record<string, unknown> }>;
}

function encounterIdFromUrl(url: string) {
  const id = url.match(/\/visits\/([^/]+)\//)?.[1];
  if (!id) throw new Error(`Encounter ID missing from URL: ${url}`);
  return id;
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
