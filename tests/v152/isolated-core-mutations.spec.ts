import { expect, test } from "@playwright/test";
import { loginAsOwner } from "../v094/helpers";

test("isolated Reception queue retry, Doctor start, sign, and closure remain connected", async ({ page }) => {
  await loginAsOwner(page);
  const suffix = Date.now().toString();
  const created = await page.evaluate(async ({ suffix }) => {
    const response = await fetch("/api/backend/patients", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": `v152-browser-patient-${suffix}` },
      body: JSON.stringify({ medicalRecordNumber: `V152-BROWSER-${suffix}`, firstName: "V152", lastName: `Browser${suffix}`, sex: "female", patientType: "GYNECOLOGY", notes: "Deterministic isolated browser test record." })
    });
    if (!response.ok) throw new Error(`patient create returned ${response.status}`);
    return response.json() as Promise<{ id: string }>;
  }, { suffix });

  try {
    await page.goto(`/reception/check-in?patientId=${created.id}`);
    await expect(page.getByText(`V152 Browser${suffix}`, { exact: false })).toBeVisible();
    await page.getByRole("radio", { name: "كشف", exact: true }).click();
    await page.getByRole("button", { name: /add to waiting line/i }).click();
    await expect(page.getByRole("status")).toContainText(/added to waiting line|already waiting/i);
    await page.getByRole("button", { name: /add to waiting line/i }).click();
    await expect(page.getByRole("status")).toContainText(/already waiting|added to waiting line/i);

    const waiting = await readPatientTickets(page, created.id);
    expect(waiting.filter((ticket) => ["waiting", "called", "in_room"].includes(ticket.status))).toHaveLength(1);

    await page.goto("/doctor/waiting");
    const row = page.locator("article.data-row").filter({ hasText: `V152 Browser${suffix}` });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Start Visit", exact: true }).click();
    await page.waitForURL(new RegExp(`/patients/${created.id}/visits/([^/]+)/encounter`), { timeout: 20_000 });
    const inRoom = await readPatientTickets(page, created.id);
    expect(inRoom.find((ticket) => ticket.status === "in_room")).toBeTruthy();

    const encounterId = page.url().match(/\/visits\/([^/]+)\/encounter/)?.[1];
    expect(encounterId).toBeTruthy();
    const signed = await page.evaluate(async (id) => {
      const response = await fetch(`/api/backend/encounters/${id}/sign`, { method: "PATCH", headers: { "content-type": "application/json" }, body: "{}" });
      return { status: response.status, body: await response.json() as { status?: string } };
    }, encounterId!);
    expect(signed.status).toBe(200);
    expect(signed.body.status).toBe("signed");
    const closed = await readPatientTickets(page, created.id);
    expect(closed.find((ticket) => ticket.status === "completed")).toBeTruthy();
  } finally {
    await page.evaluate(async (patientId) => {
      await fetch(`/api/backend/data-hygiene/patient/${patientId}/classification`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ classification: "TEST", reason: "Completed deterministic isolated v1.5.2 browser mutation test" }) });
    }, created.id).catch(() => undefined);
  }
});

async function readPatientTickets(page: import("@playwright/test").Page, patientId: string) {
  return page.evaluate(async (id) => {
    const response = await fetch("/api/backend/queue/today");
    if (!response.ok) throw new Error(`queue read returned ${response.status}`);
    const body = await response.json() as { queueTickets?: Array<{ id: string; patientId: string; status: string }> };
    return (body.queueTickets ?? []).filter((ticket) => ticket.patientId === id);
  }, patientId);
}

test("isolated spreadsheet preview defaults unique, exact-phone, and invalid rows safely", async ({ page }) => {
  await loginAsOwner(page);
  const suffix = Date.now().toString();
  const nameSuffix = timestampLetters(suffix);
  const phone = `010${suffix.slice(-8)}`;
  const existing = await page.evaluate(async ({ suffix, phone }) => {
    const response = await fetch("/api/backend/patients", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": `v152-import-existing-${suffix}` }, body: JSON.stringify({ medicalRecordNumber: `V152-IMPORT-${suffix}`, firstName: "Existing", lastName: `Import${suffix}`, sex: "female", phone, patientType: "GYNECOLOGY" }) });
    if (!response.ok) throw new Error(`existing patient returned ${response.status}`);
    return response.json() as Promise<{ id: string }>;
  }, { suffix, phone });
  try {
    await page.goto("/patients/import");
    const csv = `Full Name,Phone,Notes\nUnique Import ${nameSuffix},011${suffix.slice(-8)},isolated unique row\nExact Phone ${nameSuffix},${phone},isolated duplicate row\n,012${suffix.slice(-8)},missing required name`;
    await page.getByLabel("CSV or XLSX").setInputFiles({ name: `v152-import-${suffix}.csv`, mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await expect(page.getByText(/rows ready for column mapping/i)).toBeVisible();
    await page.getByRole("button", { name: "Run dry-run preview" }).click();
    await expect(page.getByText(/Dry run complete/i)).toBeVisible();
    const rows = page.locator("table.data-table tbody tr");
    await expect(rows).toHaveCount(3);
    const unique = rows.filter({ hasText: `Unique Import ${nameSuffix}` });
    const duplicate = rows.filter({ hasText: `Exact Phone ${nameSuffix}` });
    const invalid = rows.filter({ has: page.getByText("INVALID", { exact: true }) });
    await expect(unique.locator("select")).toHaveValue("CONFIRM_CREATE");
    await expect(unique.locator('input[type="checkbox"]')).toBeChecked();
    await expect(duplicate.locator("select")).toHaveValue("RESOLVE_EXISTING");
    await expect(duplicate.locator('input[type="checkbox"]')).toBeChecked();
    await expect(invalid.locator("select")).toHaveValue("BLOCKED");
    await expect(invalid.locator('input[type="checkbox"]')).toBeDisabled();
  } finally {
    await page.evaluate(async (patientId) => {
      await fetch(`/api/backend/data-hygiene/patient/${patientId}/classification`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ classification: "TEST", reason: "Completed deterministic isolated v1.5.2 import browser test" }) });
    }, existing.id).catch(() => undefined);
  }
});

function timestampLetters(value: string) {
  return [...value].map((digit) => String.fromCharCode(65 + Number(digit))).join("");
}
