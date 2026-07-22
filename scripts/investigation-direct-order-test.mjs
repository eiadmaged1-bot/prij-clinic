import { PrismaClient } from "@prisma/client";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const LOGIN = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_TEST_EMAIL || "eyad";
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_TEST_PASSWORD;
const prisma = new PrismaClient();
const CANONICAL_CATEGORIES = new Set([
  "Laboratory",
  "Imaging",
  "Pathology",
  "Cardiac and Functional Tests",
  "Procedures and Referrals",
  "Other"
]);

if (!PASSWORD) throw new Error("Synthetic CI password is required.");

try {
  const activeCatalog = await prisma.investigationCatalogItem.findMany({
    where: { active: true },
    select: { id: true, name: true, category: true, subcategory: true }
  });
  if (activeCatalog.length < 200) {
    throw new Error(`Expanded investigation catalogue expected at least 200 active items but found ${activeCatalog.length}.`);
  }
  const invalidCategories = [...new Set(activeCatalog.map((item) => item.category).filter((category) => !CANONICAL_CATEGORIES.has(category)))];
  if (invalidCategories.length) {
    throw new Error(`Noncanonical active investigation categories remain: ${invalidCategories.join(", ")}`);
  }
  const missingSubcategory = activeCatalog.filter((item) => !item.subcategory?.trim());
  if (missingSubcategory.length) {
    throw new Error(`${missingSubcategory.length} active investigation records are missing a subcategory.`);
  }

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

  const customName = `Synthetic CI Custom Investigation ${Date.now()}`;
  const customResponse = await fetch(`${API_URL}/investigations/catalog-management/custom`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      name: customName,
      category: "Other",
      subcategory: "CI Validation",
      modality: "Synthetic reference",
      aliases: ["CI custom investigation"]
    })
  });
  if (!customResponse.ok) throw new Error(`Custom investigation creation failed with ${customResponse.status}: ${await customResponse.text()}`);
  const customBody = await customResponse.json();
  const customItem = customBody.item;
  if (!customBody.created || !customItem?.id) throw new Error("Custom investigation endpoint did not create a catalogue item.");

  const duplicateResponse = await fetch(`${API_URL}/investigations/catalog-management/custom`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ name: customName, category: "Other", subcategory: "CI Validation" })
  });
  if (!duplicateResponse.ok) throw new Error(`Duplicate custom investigation check failed with ${duplicateResponse.status}: ${await duplicateResponse.text()}`);
  const duplicateBody = await duplicateResponse.json();
  if (!duplicateBody.duplicatePrevented || duplicateBody.item?.id !== customItem.id) {
    throw new Error("Custom investigation duplicate prevention did not reuse the existing active item.");
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
          title: customItem.name,
          requestType: customItem.category,
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

  const persisted = await prisma.investigationOrder.findUnique({
    where: { id: order.id },
    include: { items: true }
  });
  if (!persisted) throw new Error("Standalone order was not persisted in the database.");
  if (persisted.encounterId !== null) throw new Error("Persisted standalone order unexpectedly has an encounter.");
  if (persisted.items[0]?.testName !== customItem.name) throw new Error("Persisted order item does not match the custom investigation.");

  const archiveResponse = await fetch(`${API_URL}/investigations/catalog-management/${customItem.id}/archive`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      confirmation: customItem.name,
      reason: "Synthetic CI archive safety verification."
    })
  });
  if (!archiveResponse.ok) throw new Error(`Archive failed with ${archiveResponse.status}: ${await archiveResponse.text()}`);
  const archiveBody = await archiveResponse.json();
  if (!archiveBody.historicalOrdersPreserved) throw new Error("Archive response did not confirm preservation of historical orders.");

  const archivedItem = await prisma.investigationCatalogItem.findUnique({ where: { id: customItem.id } });
  if (!archivedItem || archivedItem.active) throw new Error("Archived investigation remained active.");
  const preservedOrder = await prisma.investigationOrder.findUnique({ where: { id: order.id }, include: { items: true } });
  if (!preservedOrder || preservedOrder.items[0]?.testName !== customItem.name) {
    throw new Error("Archiving the catalogue item changed or removed the historical patient order.");
  }

  const restoreResponse = await fetch(`${API_URL}/investigations/catalog-management/${customItem.id}/restore`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({})
  });
  if (!restoreResponse.ok) throw new Error(`Restore failed with ${restoreResponse.status}: ${await restoreResponse.text()}`);
  const restoredItem = await prisma.investigationCatalogItem.findUnique({ where: { id: customItem.id } });
  if (!restoredItem?.active) throw new Error("Restored investigation did not return to active status.");

  const finalArchiveResponse = await fetch(`${API_URL}/investigations/catalog-management/${customItem.id}/archive`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      confirmation: customItem.name,
      reason: "Final synthetic CI cleanup by archiving the test entry."
    })
  });
  if (!finalArchiveResponse.ok) throw new Error(`Final archive cleanup failed with ${finalArchiveResponse.status}: ${await finalArchiveResponse.text()}`);

  const audits = await prisma.auditLog.findMany({
    where: { resourceId: { in: [order.id, customItem.id] } },
    orderBy: { createdAt: "desc" },
    take: 30
  });
  if (!audits.some((entry) => entry.action === "investigation_order.created_standalone")) {
    throw new Error("Standalone investigation audit event was not found.");
  }
  if (!audits.some((entry) => entry.action === "investigation_catalog.custom_created")) {
    throw new Error("Custom investigation creation audit event was not found.");
  }
  if (!audits.some((entry) => entry.action === "investigation_catalog.archived")) {
    throw new Error("Investigation archive audit event was not found.");
  }
  if (!audits.some((entry) => entry.action === "investigation_catalog.restored")) {
    throw new Error("Investigation restore audit event was not found.");
  }

  console.log(`PASS expanded catalogue contains ${activeCatalog.length} active investigations`);
  console.log("PASS active investigation records use canonical categories and populated subcategories");
  console.log("PASS Doctor/Owner custom investigation creation and duplicate prevention");
  console.log("PASS standalone investigation order created without a fabricated encounter");
  console.log("PASS archive preserved historical patient orders and removed the item from active use");
  console.log("PASS restore returned the investigation to active use");
  console.log("PASS custom, order, archive, and restore audit events were recorded");
} finally {
  await prisma.$disconnect();
}
