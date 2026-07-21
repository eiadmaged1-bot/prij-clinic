import { disconnectTestPrisma, findTestAuditLogs, getTestPrisma } from "./security-route-manifest.mjs";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const LOGIN = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_TEST_EMAIL || "eyad";
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_TEST_PASSWORD;

if (!PASSWORD) throw new Error("Synthetic CI password is required.");

const loginResponse = await fetch(`${API_URL}/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ email: LOGIN, password: PASSWORD })
});

if (!loginResponse.ok) {
  throw new Error(`Investigation workflow login failed with ${loginResponse.status}: ${await loginResponse.text()}`);
}

const session = (loginResponse.headers.getSetCookie?.() ?? [])
  .map((value) => value.split(";", 1)[0])
  .join("; ");
const csrf = /(?:^|;\s*)csrf-token=([^;]+)/.exec(session)?.[1];
if (!session.includes("prij_clinic_session=")) throw new Error("Login did not establish a session.");

const headers = {
  accept: "application/json",
  cookie: session,
  ...(csrf ? { "x-csrf-token": csrf } : {})
};

const patientsResponse = await fetch(`${API_URL}/patients?page=1&limit=20`, { headers });
if (!patientsResponse.ok) throw new Error(`Patient search failed with ${patientsResponse.status}.`);
const patientsBody = await patientsResponse.json();
let patient = (patientsBody.patients ?? [])[0];

if (!patient) {
  const createResponse = await fetch(`${API_URL}/patients`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      medicalRecordNumber: `CI-INV-${Date.now()}`,
      firstName: "Synthetic",
      lastName: "Investigation",
      notes: "Synthetic CI patient for standalone investigation workflow validation only."
    })
  });
  if (!createResponse.ok) throw new Error(`Synthetic patient creation failed with ${createResponse.status}: ${await createResponse.text()}`);
  patient = await createResponse.json();
}

const requestNote = `Synthetic direct investigation order ${Date.now()}`;
const orderResponse = await fetch(`${API_URL}/investigations/standalone-orders`, {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({
    patientId: patient.id,
    priority: "routine",
    requestNote,
    internalExternal: "internal",
    responsibilityJson: { followUpOwner: "CI clinical owner" },
    items: [
      {
        title: "Complete Blood Count (CBC)",
        requestType: "Laboratory",
        requestNote: "Synthetic CI indication only."
      }
    ]
  })
});

if (!orderResponse.ok) {
  throw new Error(`Standalone investigation order failed with ${orderResponse.status}: ${await orderResponse.text()}`);
}

const order = await orderResponse.json();
if (!order.id) throw new Error("Standalone order did not return an id.");
if (order.patientId !== patient.id) throw new Error("Standalone order was attached to the wrong patient.");
if (order.encounterId !== null) throw new Error("Standalone order fabricated an encounter link.");
if (!Array.isArray(order.items) || order.items.length !== 1) throw new Error("Standalone order did not persist its item.");

const prisma = getTestPrisma();
const persisted = await prisma.investigationOrder.findUnique({
  where: { id: order.id },
  include: { items: true }
});
if (!persisted) throw new Error("Standalone order was not persisted in the database.");
if (persisted.encounterId !== null) throw new Error("Persisted standalone order unexpectedly has an encounter.");
if (persisted.items[0]?.testName !== "Complete Blood Count (CBC)") throw new Error("Persisted order item does not match the submitted investigation.");

const audits = await findTestAuditLogs({ resourceId: order.id });
const audit = audits.find((entry) => entry.action === "investigation_order.created_standalone");
if (!audit) throw new Error("Standalone investigation audit event was not found.");
if (audit.metadataJson?.encounterId !== null) throw new Error("Standalone audit did not confirm a null encounter.");
if (audit.metadataJson?.source !== "investigation_station") throw new Error("Standalone audit did not record the Investigation Station source.");

console.log("PASS standalone Doctor/Owner investigation order created without a fabricated encounter");
console.log("PASS standalone investigation order persisted with the selected patient and item");
console.log("PASS standalone investigation order created its audit event");

await disconnectTestPrisma();
