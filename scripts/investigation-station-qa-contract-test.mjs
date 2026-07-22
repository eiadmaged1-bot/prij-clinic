import { PrismaClient } from "@prisma/client";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const LOGIN = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_TEST_EMAIL || "eyad";
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_TEST_PASSWORD;
const prisma = new PrismaClient();
const expectedCategories = [
  "Laboratory",
  "Imaging",
  "Pathology",
  "Cardiac and Functional Tests",
  "Procedures and Referrals",
  "Other"
];
const requiredCodes = [
  "SEMEN_ANALYSIS",
  "URINALYSIS",
  "URINE_CULTURE",
  "COAGULATION_PROFILE",
  "OBSTETRIC_DOPPLER"
];

if (!PASSWORD) throw new Error("Synthetic CI password is required.");

try {
  const login = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email: LOGIN, password: PASSWORD })
  });
  if (!login.ok) throw new Error(`Login failed with ${login.status}: ${await login.text()}`);
  const session = (login.headers.getSetCookie?.() ?? []).map((value) => value.split(";", 1)[0]).join("; ");
  const csrf = /(?:^|;\s*)csrf-token=([^;]+)/.exec(session)?.[1];
  if (!session.includes("prij_clinic_session=")) throw new Error("Login did not establish a session.");
  const headers = { accept: "application/json", cookie: session, ...(csrf ? { "x-csrf-token": csrf } : {}) };

  const workspaceResponse = await fetch(`${API_URL}/investigations/station/workspace`, { headers });
  if (!workspaceResponse.ok) throw new Error(`Station workspace failed with ${workspaceResponse.status}: ${await workspaceResponse.text()}`);
  const workspace = await workspaceResponse.json();
  const catalog = workspace.investigationCatalog ?? [];
  if (catalog.length < 200) throw new Error(`Station workspace exposed only ${catalog.length} active investigations.`);
  const categories = new Set(catalog.map((item) => item.category));
  const missingCategories = expectedCategories.filter((category) => !categories.has(category));
  if (missingCategories.length) throw new Error(`Station workspace is missing categories: ${missingCategories.join(", ")}`);

  const codes = new Set(catalog.map((item) => item.code));
  const missingCodes = requiredCodes.filter((code) => !codes.has(code));
  if (missingCodes.length) throw new Error(`Station workspace is missing critical investigation codes: ${missingCodes.join(", ")}`);

  const patientsResponse = await fetch(`${API_URL}/patients?page=1&limit=20`, { headers });
  if (!patientsResponse.ok) throw new Error(`Patient search failed with ${patientsResponse.status}.`);
  const patients = (await patientsResponse.json()).patients ?? [];
  let patient = patients[0];
  if (!patient) {
    const createPatient = await fetch(`${API_URL}/patients`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ medicalRecordNumber: `CI-STATION-${Date.now()}`, firstName: "Synthetic", lastName: "Station", notes: "Synthetic CI patient only." })
    });
    if (!createPatient.ok) throw new Error(`Synthetic patient creation failed with ${createPatient.status}: ${await createPatient.text()}`);
    patient = await createPatient.json();
  }

  const selected = catalog.find((item) => item.code === "COAGULATION_PROFILE") ?? catalog[0];
  if (!selected?.id) throw new Error("Station workspace did not provide a usable investigation item.");

  const listName = `Station QA ${Date.now()}`;
  const createList = await fetch(`${API_URL}/investigations/station/lists`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ name: listName, investigationCatalogItemIds: [selected.id] })
  });
  if (!createList.ok) throw new Error(`List creation failed with ${createList.status}: ${await createList.text()}`);
  const list = await createList.json();

  const duplicateName = await fetch(`${API_URL}/investigations/station/lists`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ name: `  ${listName.toUpperCase()}  `, investigationCatalogItemIds: [selected.id] })
  });
  if (duplicateName.status !== 400) throw new Error(`Duplicate normalized list name should return 400, received ${duplicateName.status}.`);

  const duplicateList = await fetch(`${API_URL}/investigations/station/lists/${list.id}/duplicate`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({})
  });
  if (!duplicateList.ok) throw new Error(`List duplication failed with ${duplicateList.status}: ${await duplicateList.text()}`);
  const copiedList = await duplicateList.json();
  if (!copiedList.id || normalize(copiedList.name) === normalize(list.name)) throw new Error("List duplication did not create a uniquely named copy.");

  const requestNote = `Station QA direct order ${Date.now()}`;
  const direct = await fetch(`${API_URL}/investigations/standalone-orders`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      patientId: patient.id,
      priority: "routine",
      requestNote,
      internalExternal: "internal",
      responsibilityJson: { followUpOwner: "CI doctor" },
      items: [{ title: selected.name, catalogItemId: selected.id, requestType: selected.category, requestNote }]
    })
  });
  if (!direct.ok) throw new Error(`Real station direct-order payload failed with ${direct.status}: ${await direct.text()}`);
  const order = await direct.json();
  if (!order.id || order.patientId !== patient.id || order.encounterId !== null) throw new Error("Direct order returned an invalid patient or encounter contract.");

  const patientActivity = await fetch(`${API_URL}/clinical-requests?patientId=${encodeURIComponent(patient.id)}&page=1&limit=50`, { headers });
  if (!patientActivity.ok) throw new Error(`Patient investigation activity failed with ${patientActivity.status}: ${await patientActivity.text()}`);
  const patientBody = await patientActivity.json();
  if (!(patientBody.clinicalRequests ?? []).some((entry) => entry.id === order.id)) {
    throw new Error("Direct order did not appear through the patient-file investigation endpoint.");
  }

  for (const id of [list.id, copiedList.id]) {
    const archive = await fetch(`${API_URL}/investigations/station/lists/${id}`, { method: "DELETE", headers });
    if (!archive.ok) throw new Error(`Synthetic list cleanup failed with ${archive.status}: ${await archive.text()}`);
  }

  const persisted = await prisma.investigationOrder.findUnique({ where: { id: order.id }, include: { items: true } });
  if (!persisted || persisted.items[0]?.testName !== selected.name) throw new Error("Direct order was not persisted correctly.");

  console.log(`PASS station workspace exposes ${catalog.length} active investigations and all six canonical categories`);
  console.log("PASS critical andrology, urine, coagulation, and Doppler investigation codes are present");
  console.log("PASS normalized duplicate personal-list names are blocked");
  console.log("PASS list duplication creates a unique explicit copy");
  console.log("PASS real frontend direct-order payload accepts catalogItemId without fabricating an encounter");
  console.log("PASS direct order appears through the patient-file investigation endpoint");
} finally {
  await prisma.$disconnect();
}

function normalize(value) {
  return String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
