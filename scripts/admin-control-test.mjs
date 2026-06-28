import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("ADMIN-CONTROL");

async function main() {
  await waitForApi();

  const adminLogin = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const admin = adminLogin.token;
  if (!admin) throw new Error("eyad login did not return token.");
  if (!adminLogin.user?.roles?.includes("Owner")) throw new Error("eyad login is not assigned the Owner role.");
  record.pass("eyad local admin login works");

  const reception = await login(demoUsers.reception);
  assertStatus(await apiStatus("GET", "/admin/control-center", reception), 403, "reception admin control center");
  record.pass("non-admin cannot access admin control center API");

  const control = await apiJson("GET", "/admin/control-center", admin);
  if (control.safety?.auditLogsCanBeDeleted !== false) throw new Error("admin control center did not mark audit logs protected.");
  if (control.safety?.signedClinicalRecordsHardDelete !== false) throw new Error("admin control center did not block signed hard delete.");
  record.pass("admin safety settings are explicit");

  const service = await apiJson("POST", "/admin/services", admin, {
    code: `DEMO-SVC-${Date.now()}`,
    name: "Demo admin service",
    category: "Consultation",
    price: 111,
    currency: "EGP"
  });
  const updatedService = await apiJson("PATCH", `/admin/services/${service.id}`, admin, { price: 222, active: false });
  if (String(updatedService.price) !== "222") throw new Error("service price update did not persist.");
  if (updatedService.active !== false) throw new Error("service deactivate did not persist.");
  record.pass("admin can add and update service pricing");

  const patient = await apiJson("POST", "/patients", admin, {
    medicalRecordNumber: `DEMO-ADMIN-${Date.now()}`,
    firstName: "Demo",
    lastName: "AdminControl",
    notes: "Fake local admin control test patient only."
  });
  const invoice = await apiJson("POST", "/billing/invoices", admin, {
    patientId: patient.id,
    invoiceNumber: `DEMO-ADMIN-INV-${Date.now()}`,
    items: [{ description: "Demo admin override service", quantity: 1, unitAmount: 50 }]
  });

  assertStatus(await apiStatus("POST", `/admin/overrides/invoices/${invoice.id}/void`, admin, { confirmation: "CONFIRM" }), 400, "invoice override without reason");
  record.pass("admin override requires reason");

  const voided = await apiJson("POST", `/admin/overrides/invoices/${invoice.id}/void`, admin, {
    reason: "Local demo correction from admin control test.",
    confirmation: "CONFIRM"
  });
  if (voided.status !== "voided") throw new Error("invoice was not voided by admin override.");
  record.pass("admin can void invoice with reason");

  assertStatus(await apiStatus("POST", `/admin/overrides/patients/${patient.id}/archive`, reception, {
    reason: "Unauthorized attempt.",
    confirmation: "CONFIRM"
  }), 403, "non-admin patient archive override");
  record.pass("normal roles cannot force admin override actions");

  assertStatus(await apiStatus("DELETE", "/audit", admin), 404, "delete audit route");
  assertStatus(await apiStatus("DELETE", `/encounters/${invoice.id}`, admin), 404, "hard delete signed clinical route");
  record.pass("audit logs and clinical records have no normal hard-delete API routes");

  const audit = (await apiJson("GET", "/audit?limit=100", admin)).auditLogs ?? [];
  const overrideAudit = audit.find((entry) => entry.resourceId === invoice.id && entry.action === "admin_override.invoice_voided");
  if (!overrideAudit?.reason) throw new Error("admin override audit entry with reason was not found.");
  const serviceAudit = audit.find((entry) => entry.resourceId === service.id && entry.action === "service_item.updated");
  if (!serviceAudit) throw new Error("service update audit entry was not found.");
  record.pass("admin control actions create audit entries");
}

await main().catch((error) => record.fail("admin control setup", error));
record.summary();
