import { expect, test, type Page, type Route, type TestInfo } from "@playwright/test";

const ownerLogin = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_OWNER_LOGIN;
const password = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_OWNER_PASSWORD || process.env.DEMO_TEST_PASSWORD;
const receptionistLogin = "runtime.reception@prij.local";

if (!ownerLogin || !password) {
  throw new Error("Synthetic CI credentials are required for Impeccable Round 4.");
}

test.describe.serial("Impeccable Round 4 — failure, conflict, session, and role security", () => {
  test("renders recoverable failure states and enforces role boundaries without bypassing the shared encounter", async ({ page }, testInfo) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page, ownerLogin!, password!);

    const saveFailureVisit = await createInitialCockpitVisit(page, "SaveFailure");
    await proveSaveFailureAndRecovery(page, testInfo, saveFailureVisit);

    const conflictVisit = await createAdditionalCockpitVisit(page, "Conflict");
    await proveVersionConflict(page, testInfo, conflictVisit);

    const partialVisit = await createAdditionalCockpitVisit(page, "PartialResource");
    await provePartialResourceState(page, testInfo, partialVisit);

    const unavailableVisit = await createAdditionalCockpitVisit(page, "Unavailable");
    await proveResourceUnavailableState(page, testInfo, unavailableVisit);

    const sessionVisit = await createAdditionalCockpitVisit(page, "Session");
    await proveSessionExpiredState(page, testInfo, sessionVisit);

    const deniedVisit = await createAdditionalCockpitVisit(page, "Denied");
    await proveAccessDeniedState(page, testInfo, deniedVisit);

    await proveReceptionistRoleBoundary(page, testInfo, deniedVisit);

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });
});

type VisitRef = {
  patientId: string;
  patientName: string;
  encounterId: string;
  visitUrl: string;
};

async function proveSaveFailureAndRecovery(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const patchPattern = exactVisitPattern(visit);
  let failed = false;
  const handler = async (route: Route) => {
    if (route.request().method() === "PATCH" && !failed) {
      failed = true;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Synthetic temporary save outage" })
      });
      return;
    }
    await route.continue();
  };

  await page.route(patchPattern, handler);
  await page.locator("#cockpit-tab-history").click();
  await page.getByLabel(/^Required complaint$/i).fill(`Round 4 recoverable save ${Date.now()}`);
  await expect(page.getByText(/^Save failed$/i)).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: /^Retry save$/i })).toBeVisible();
  await capture(page, testInfo, "01-save-failed-retry.png");
  await expectNoWholePageOverflow(page);
  await expectNoCrashText(page);

  await page.unroute(patchPattern, handler);
  await page.getByRole("button", { name: /^Retry save$/i }).click();
  await expect(page.getByText(/^Saved$/i)).toBeVisible({ timeout: 25_000 });
}

async function proveVersionConflict(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const packet = await readPacket(page, visit.patientId, visit.encounterId);
  const revision = String(packet.encounter?.updatedAt ?? "");
  expect(revision).not.toBe("");

  const external = await patchVisit(page, visit, {
    revision,
    assessmentText: `Synthetic concurrent server edit ${Date.now()}`
  });
  expect(external.ok, JSON.stringify(external)).toBe(true);

  await page.locator("#cockpit-tab-history").click();
  await page.getByLabel(/^Required complaint$/i).fill(`Round 4 stale local edit ${Date.now()}`);
  await expect(page.getByText(/^Version conflict$/i)).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: /^Reload server version$/i })).toBeVisible();
  await capture(page, testInfo, "02-version-conflict.png");
  await expectNoWholePageOverflow(page);
  await expectNoCrashText(page);

  await page.getByRole("button", { name: /^Reload server version$/i }).click();
  await expect(page.getByText(/^Saved$/i)).toBeVisible({ timeout: 25_000 });
}

async function provePartialResourceState(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const packetPattern = exactPacketPattern(visit);
  const handler = async (route: Route) => {
    const response = await route.fetch();
    const body = await response.json() as Record<string, unknown>;
    const currentErrors = Array.isArray(body.resourceErrors) ? body.resourceErrors : [];
    await route.fulfill({
      response,
      json: {
        ...body,
        resourceErrors: [
          ...currentErrors,
          { resource: "history", message: "Synthetic partial longitudinal-history failure" }
        ]
      }
    });
  };

  await page.route(packetPattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: visit.patientName })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText(/Some related clinical information did not load/i)).toBeVisible();
  await page.getByRole("button", { name: /^Clinical context$/i }).click();
  await expect(page.getByText(/This information did not fully load/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^Retry$/i })).toBeVisible();
  await capture(page, testInfo, "03-partial-resource-warning.png");
  await expectNoWholePageOverflow(page);
  await expectNoCrashText(page);

  await page.unroute(packetPattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: visit.patientName })).toBeVisible({ timeout: 25_000 });
}

async function proveResourceUnavailableState(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const packetPattern = exactPacketPattern(visit);
  const handler = async (route: Route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Synthetic visit packet outage" })
    });
  };

  await page.route(packetPattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: /^Clinical information unavailable$/i })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: /^Retry$/i })).toBeVisible();
  await capture(page, testInfo, "04-resource-unavailable.png");
  await expectNoWholePageOverflow(page);
  await expectNoCrashText(page);

  await page.unroute(packetPattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: visit.patientName })).toBeVisible({ timeout: 25_000 });
}

async function proveSessionExpiredState(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const packetPattern = exactPacketPattern(visit);
  const handler = async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Synthetic expired session" })
    });
  };

  await page.route(packetPattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: /^Session expired$/i })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText(/Sign in again before continuing this visit/i)).toBeVisible();
  await capture(page, testInfo, "05-session-expired.png");
  await expectNoWholePageOverflow(page);
  await expectNoCrashText(page);

  await page.unroute(packetPattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: visit.patientName })).toBeVisible({ timeout: 25_000 });
}

async function proveAccessDeniedState(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const packetPattern = exactPacketPattern(visit);
  const handler = async (route: Route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ message: "Synthetic forbidden visit packet" })
    });
  };

  await page.route(packetPattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: /^Access denied$/i })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText(/You do not have access to this visit/i)).toBeVisible();
  await capture(page, testInfo, "06-access-denied.png");
  await expectNoWholePageOverflow(page);
  await expectNoCrashText(page);

  await page.unroute(packetPattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: visit.patientName })).toBeVisible({ timeout: 25_000 });
}

async function proveReceptionistRoleBoundary(page: Page, testInfo: TestInfo, visit: VisitRef) {
  await signIn(page, receptionistLogin, password!);
  await expect(page).toHaveURL(/\/reception(?:$|[/?#])/, { timeout: 25_000 });

  const packetStatus = await page.evaluate(async ({ patientId, encounterId }) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = {};
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`/api/backend/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/packet`, {
      credentials: "include",
      headers
    });
    return response.status;
  }, { patientId: visit.patientId, encounterId: visit.encounterId });
  expect(packetStatus).toBe(403);

  await page.goto(visit.visitUrl);
  await expect(page).toHaveURL(/\/reception(?:$|[/?#])/, { timeout: 25_000 });
  await expect(page.getByRole("heading", { name: /Reception/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: visit.patientName })).toHaveCount(0);
  await capture(page, testInfo, "07-receptionist-role-denied.png");
  await expectNoWholePageOverflow(page);
  await expectNoCrashText(page);
}

async function createInitialCockpitVisit(page: Page, marker: string): Promise<VisitRef> {
  const patient = await createSyntheticPatient(page, marker);
  const clinicalCare = page.getByRole("button", { name: /^Clinical care$/i });
  await expect(clinicalCare).toBeVisible({ timeout: 25_000 });
  await clinicalCare.click();

  const visitPanel = page.locator('[aria-label="Current visit clinical workspace"]');
  await expect(visitPanel).toBeVisible();
  await visitPanel.getByRole("button", { name: /open current visit/i }).click();
  await page.waitForURL(new RegExp(`/patients/${patient.id}/visits/[^/]+/encounter(?:$|[/?#])`), { timeout: 25_000 });

  const encounterId = encounterIdFromUrl(page.url());
  const options = page.locator(".patient-visit-identity-bar .filter-drawer > summary");
  await expect(options).toBeVisible({ timeout: 25_000 });
  await options.click();
  await page.getByRole("button", { name: /Open Visit Cockpit/i }).click();
  await expectFocusedVisit(page, patient.name);

  return {
    patientId: patient.id,
    patientName: patient.name,
    encounterId,
    visitUrl: `/patients/${patient.id}/visits/${encounterId}/encounter`
  };
}

async function createAdditionalCockpitVisit(page: Page, marker: string): Promise<VisitRef> {
  const patient = await createSyntheticPatient(page, marker);
  const started = await page.evaluate(async (patientId) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`/api/backend/patients/${encodeURIComponent(patientId)}/doctor-visit/start`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({})
    });
    return { ok: response.ok, status: response.status, body: await response.json().catch(() => null) };
  }, patient.id);

  expect(started.ok, JSON.stringify(started)).toBe(true);
  const encounterId = String((started.body as { encounter?: { id?: unknown } } | null)?.encounter?.id ?? "");
  expect(encounterId).not.toBe("");
  const visitUrl = `/patients/${patient.id}/visits/${encounterId}/encounter`;
  await page.goto(visitUrl);
  await expectFocusedVisit(page, patient.name);

  return { patientId: patient.id, patientName: patient.name, encounterId, visitUrl };
}

async function createSyntheticPatient(page: Page, marker: string) {
  await page.goto("/patients/new");
  await expect(page.getByRole("heading", { name: /^New Patient$/i })).toBeVisible({ timeout: 25_000 });

  const suffix = String(Date.now()).slice(-7);
  const patientName = `QA ${marker}${suffix}`;
  await page.getByLabel(/full name/i).fill(patientName);
  await page.getByLabel(/phone number/i).fill(`012${suffix}`);
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

async function signIn(page: Page, identifier: string, passwordValue: string) {
  await page.goto("/login");
  const switchAccount = page.getByRole("button", { name: /log out and switch account/i });
  if (await switchAccount.isVisible().catch(() => false)) await switchAccount.click();

  await page.getByLabel(/staff id or email/i).fill(identifier);
  await page.getByLabel(/password/i).fill(passwordValue);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(dashboard|owner-control|doctor|reception)(?:$|[/?#])/, { timeout: 25_000 });
}

async function expectFocusedVisit(page: Page, patientName: string) {
  await expect(page.getByRole("heading", { name: patientName })).toBeVisible({ timeout: 25_000 });
  const workflow = page.getByRole("tablist", { name: /Visit workflow/i });
  await expect(workflow).toBeVisible();
  await expect(workflow.getByRole("tab")).toHaveCount(3);
  await expect(page.locator("aside.sidebar")).toBeHidden();
}

async function readPacket(page: Page, patientId: string, encounterId: string) {
  return page.evaluate(async ({ patientId: resolvedPatientId, encounterId: resolvedEncounterId }) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = {};
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`/api/backend/patients/${encodeURIComponent(resolvedPatientId)}/doctor-visit/${encodeURIComponent(resolvedEncounterId)}/packet`, {
      credentials: "include",
      headers
    });
    if (!response.ok) throw new Error(`Packet read failed with ${response.status}`);
    return response.json();
  }, { patientId, encounterId }) as Promise<{ encounter?: Record<string, unknown> }>;
}

async function patchVisit(page: Page, visit: VisitRef, body: Record<string, unknown>) {
  return page.evaluate(async ({ patientId, encounterId, body: requestBody }) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`/api/backend/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(requestBody)
    });
    return { ok: response.ok, status: response.status, body: await response.json().catch(() => null) };
  }, { patientId: visit.patientId, encounterId: visit.encounterId, body });
}

function exactVisitPattern(visit: VisitRef) {
  return `**/api/backend/patients/${visit.patientId}/doctor-visit/${visit.encounterId}`;
}

function exactPacketPattern(visit: VisitRef) {
  return `**/api/backend/patients/${visit.patientId}/doctor-visit/${visit.encounterId}/packet`;
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
