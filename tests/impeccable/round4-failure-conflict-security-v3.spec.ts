import { expect, test, type Page, type Route, type TestInfo } from "@playwright/test";

const ownerLogin = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_OWNER_LOGIN;
const password = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_OWNER_PASSWORD || process.env.DEMO_TEST_PASSWORD;
const receptionistLogin = "runtime.reception@prij.local";

if (!ownerLogin || !password) throw new Error("Synthetic CI credentials are required for Impeccable Round 4.");

type VisitRef = { patientId: string; patientName: string; encounterId: string; visitUrl: string };

let roleBoundaryVisit: VisitRef | null = null;

test.describe.serial("Impeccable Round 4 — failure, conflict, session, and role security", () => {
  test("renders recoverable save, conflict, resource, session, and access states", async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await signInFresh(page, ownerLogin!, password!);

    const saveVisit = await createInitialCockpitVisit(page, "SaveFailure");
    await saveFailureAndRecovery(page, testInfo, saveVisit);

    const conflictVisit = await createCockpitVisit(page, "Conflict");
    await versionConflict(page, testInfo, conflictVisit);

    const stateVisit = await createCockpitVisit(page, "States");
    await partialResource(page, testInfo, stateVisit);
    await packetFailure(page, testInfo, stateVisit, 503, "Clinical information unavailable", "04-resource-unavailable.png");
    await packetFailure(page, testInfo, stateVisit, 401, "Session expired", "05-session-expired.png");
    await packetFailure(page, testInfo, stateVisit, 403, "Access denied", "06-access-denied.png");

    roleBoundaryVisit = stateVisit;
    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });

  test("denies the real receptionist session access to the doctor visit", async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    expect(roleBoundaryVisit, "The owner-state test must create a visit for the role boundary check.").not.toBeNull();
    const visit = roleBoundaryVisit!;

    await page.setViewportSize({ width: 1440, height: 900 });
    await signInFresh(page, receptionistLogin, password!);
    await expect(page).toHaveURL(/\/reception(?:$|[/?#])/, { timeout: 25_000 });

    const status = await page.evaluate(async ({ patientId, encounterId }) => {
      const token = sessionStorage.getItem("prijClinicToken");
      const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};
      const response = await fetch(`/api/backend/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/packet`, {
        credentials: "include",
        headers
      });
      return response.status;
    }, visit);
    expect(status).toBe(403);

    await page.goto(visit.visitUrl);
    await expect(page).toHaveURL(/\/reception(?:$|[/?#])/, { timeout: 25_000 });
    await expect(page.getByRole("heading", { name: visit.patientName })).toHaveCount(0);
    await captureAndCheck(page, testInfo, "07-receptionist-role-denied.png");
  });
});

async function saveFailureAndRecovery(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const pattern = visitPatchPattern(visit);
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

  await page.route(pattern, handler);
  await page.locator("#cockpit-tab-history").click();
  await page.getByLabel(/^Required complaint$/i).fill(`Round 4 recoverable save ${Date.now()}`);
  await expect(page.locator("footer").getByText(/^Save failed$/i)).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: /^Retry save$/i })).toBeVisible();
  await captureAndCheck(page, testInfo, "01-save-failed-retry.png");

  await page.unroute(pattern, handler);
  await page.getByRole("button", { name: /^Retry save$/i }).click();
  await expect(page.locator("footer").getByText(/^Saved$/i)).toBeVisible({ timeout: 25_000 });
}

async function versionConflict(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const packet = await readPacket(page, visit);
  const revision = String(packet.encounter?.updatedAt ?? "");
  expect(revision).not.toBe("");

  const external = await patchVisit(page, visit, {
    revision,
    assessmentText: `Concurrent server edit ${Date.now()}`
  });
  expect(external.ok, JSON.stringify(external)).toBe(true);

  await page.locator("#cockpit-tab-history").click();
  await page.getByLabel(/^Required complaint$/i).fill(`Stale local edit ${Date.now()}`);
  await expect(page.locator("footer").getByText(/^Version conflict$/i)).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: /^Reload server version$/i })).toBeVisible();
  await captureAndCheck(page, testInfo, "02-version-conflict.png");
}

async function partialResource(page: Page, testInfo: TestInfo, visit: VisitRef) {
  const pattern = packetPattern(visit);
  const handler = async (route: Route) => {
    const response = await route.fetch();
    const body = await response.json() as Record<string, unknown>;
    const errors = Array.isArray(body.resourceErrors) ? body.resourceErrors : [];
    await route.fulfill({
      response,
      json: {
        ...body,
        resourceErrors: [...errors, { resource: "history", message: "Synthetic partial history failure" }]
      }
    });
  };

  await page.route(pattern, handler);
  await page.reload();
  await expectFocusedVisit(page, visit.patientName);
  await expect(page.getByText(/Some related clinical information did not load/i)).toBeVisible();
  await page.getByRole("button", { name: /^Clinical context$/i }).click();
  await expect(page.getByText(/This information did not fully load/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^Retry$/i }).first()).toBeVisible();
  await captureAndCheck(page, testInfo, "03-partial-resource-warning.png");

  await page.unroute(pattern, handler);
  await page.reload();
  await expectFocusedVisit(page, visit.patientName);
}

async function packetFailure(
  page: Page,
  testInfo: TestInfo,
  visit: VisitRef,
  status: number,
  heading: string,
  screenshot: string
) {
  const pattern = packetPattern(visit);
  const handler = async (route: Route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ message: `Synthetic ${status} visit packet state` })
    });
  };

  await page.route(pattern, handler);
  await page.reload();
  await expect(page.getByRole("heading", { name: new RegExp(`^${escapeRegex(heading)}$`, "i") })).toBeVisible({ timeout: 25_000 });
  if (status === 503) await expect(page.getByRole("button", { name: /^Retry$/i })).toBeVisible();
  await captureAndCheck(page, testInfo, screenshot);

  await page.unroute(pattern, handler);
  await page.reload();
  await expectFocusedVisit(page, visit.patientName);
}

async function createInitialCockpitVisit(page: Page, marker: string): Promise<VisitRef> {
  const patient = await createPatient(page, marker);
  await page.getByRole("button", { name: /^Clinical care$/i }).click();
  const panel = page.locator('[aria-label="Current visit clinical workspace"]');
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: /open current visit/i }).click();
  await page.waitForURL(new RegExp(`/patients/${patient.id}/visits/[^/]+/encounter(?:$|[/?#])`), { timeout: 25_000 });
  const encounterId = encounterIdFromUrl(page.url());

  const options = page.locator(".patient-visit-identity-bar .filter-drawer > summary");
  await expect(options).toBeVisible({ timeout: 25_000 });
  await options.click();
  await page.getByRole("button", { name: /Open Visit Cockpit/i }).click();
  await expectFocusedVisit(page, patient.name);
  return ref(patient, encounterId);
}

async function createCockpitVisit(page: Page, marker: string): Promise<VisitRef> {
  const patient = await createPatient(page, marker);
  const started = await page.evaluate(async (patientId) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    };
    const response = await fetch(`/api/backend/patients/${encodeURIComponent(patientId)}/doctor-visit/start`, {
      method: "POST",
      credentials: "include",
      headers,
      body: "{}"
    });
    return { ok: response.ok, status: response.status, body: await response.json().catch(() => null) };
  }, patient.id);

  expect(started.ok, JSON.stringify(started)).toBe(true);
  const encounterId = String((started.body as { encounter?: { id?: unknown } } | null)?.encounter?.id ?? "");
  expect(encounterId).not.toBe("");
  const visit = ref(patient, encounterId);
  await page.goto(visit.visitUrl);
  await expectFocusedVisit(page, patient.name);
  return visit;
}

async function createPatient(page: Page, marker: string) {
  await page.goto("/patients/new");
  await expect(page.getByRole("heading", { name: /^New Patient$/i })).toBeVisible({ timeout: 25_000 });

  const suffix = String(Date.now()).slice(-7);
  const name = `QA ${marker}${suffix}`;
  await page.getByLabel(/full name/i).fill(name);
  await page.getByLabel(/phone number/i).fill(`012${suffix}`);
  await page.getByRole("button", { name: /save file only/i }).click();

  const open = page.getByRole("link", { name: /open reception profile/i });
  await expect(open).toBeVisible({ timeout: 25_000 });
  await open.click();
  await page.waitForURL(/\/patients\/(?!new(?:$|[/?#])|import(?:$|[/?#]))[^/?#]+(?:$|[/?#])/, { timeout: 25_000 });

  const id = page.url().match(/\/patients\/([^/?#]+)/)?.[1];
  if (!id || ["import", "new"].includes(id)) throw new Error(`Canonical patient workspace missing: ${page.url()}`);
  return { id, name };
}

async function signInFresh(page: Page, identifier: string, passwordValue: string) {
  await page.goto("/login");
  const identifierField = page.getByLabel(/staff id or email/i);
  await expect(identifierField).toBeVisible({ timeout: 25_000 });
  await identifierField.fill(identifier);
  await page.getByLabel(/password/i).fill(passwordValue);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(dashboard|owner-control|doctor|reception)(?:$|[/?#])/, { timeout: 25_000 });
}

async function expectFocusedVisit(page: Page, patientName: string) {
  await expect(page.getByRole("heading", { name: patientName })).toBeVisible({ timeout: 25_000 });
  const workflow = page.getByRole("tablist", { name: /Visit workflow/i });
  await expect(workflow.getByRole("tab")).toHaveCount(3);
  await expect(page.locator("aside.sidebar")).toBeHidden();
}

async function readPacket(page: Page, visit: VisitRef) {
  return page.evaluate(async ({ patientId, encounterId }) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};
    const response = await fetch(`/api/backend/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}/packet`, {
      credentials: "include",
      headers
    });
    if (!response.ok) throw new Error(`Packet read failed with ${response.status}`);
    return response.json();
  }, visit) as Promise<{ encounter?: Record<string, unknown> }>;
}

async function patchVisit(page: Page, visit: VisitRef, body: Record<string, unknown>) {
  return page.evaluate(async ({ patientId, encounterId, body: requestBody }) => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    };
    const response = await fetch(`/api/backend/patients/${encodeURIComponent(patientId)}/doctor-visit/${encodeURIComponent(encounterId)}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(requestBody)
    });
    return { ok: response.ok, status: response.status, body: await response.json().catch(() => null) };
  }, { ...visit, body });
}

function ref(patient: { id: string; name: string }, encounterId: string): VisitRef {
  return {
    patientId: patient.id,
    patientName: patient.name,
    encounterId,
    visitUrl: `/patients/${patient.id}/visits/${encounterId}/encounter`
  };
}

function encounterIdFromUrl(url: string) {
  const id = url.match(/\/visits\/([^/]+)\//)?.[1];
  if (!id) throw new Error(`Encounter ID missing from URL: ${url}`);
  return id;
}

function visitPatchPattern(visit: VisitRef) {
  return `**/api/backend/patients/${visit.patientId}/doctor-visit/${visit.encounterId}`;
}

function packetPattern(visit: VisitRef) {
  return `**/api/backend/patients/${visit.patientId}/doctor-visit/${visit.encounterId}/packet`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function captureAndCheck(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(name), fullPage: true });
  const metrics = await page.evaluate(() => ({
    root: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    body: document.body.scrollWidth
  }));
  expect(metrics.root, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.client + 2);
  expect(metrics.body, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.client + 2);

  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  expect(text).not.toMatch(/Unhandled Runtime Error|Application error|TypeError:|ReferenceError:|ECONNREFUSED|Internal Server Error/i);
  expect(text).not.toMatch(/DATABASE_URL|JWT_SECRET|schema\.prisma|Bearer\s+[a-z0-9._-]+/i);
}
