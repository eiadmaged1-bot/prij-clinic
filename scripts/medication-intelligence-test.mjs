import { readFile } from "node:fs/promises";
import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("MED-INTEL");

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const doctor = await login(demoUsers.doctor);
  const reception = await login(demoUsers.reception);
  const accountant = await login(demoUsers.accountant);

  const acei = await apiJson("POST", "/medications/search", doctor, { query: "ACEI" });
  assertHasResult(acei, "family", "ACE inhibitor");
  record.pass("medication search by abbreviation ACEI");

  const beta = await apiJson("POST", "/medications/search", doctor, { query: "beta blocker" });
  assertHasResult(beta, "family", "beta blocker");
  record.pass("medication search by family");

  const nsaid = await apiJson("POST", "/medications/search", doctor, { query: "NSAID" });
  assertHasResult(nsaid, "family", "NSAID");
  record.pass("medication search by NSAID family");

  const folic = await apiJson("POST", "/medications/search", doctor, { query: "folic" });
  assertHasResult(folic, "ingredient", "folic acid");
  assertHasResult(folic, "product", "DemoFolicAcid");
  record.pass("medication search finds folic acid demo content");

  const brand = await apiJson("POST", "/medications/search", doctor, { query: "Demoace" });
  assertHasResult(brand, "product", "Demo ACE ingredient");
  record.pass("medication search by brand and generic");

  assertStatus(await apiStatus("POST", "/medications/safety-check", reception, { patientId: "00000000-0000-0000-0000-000000000000" }), 403, "reception safety denied");
  assertStatus(await apiStatus("POST", "/medications/safety-check", accountant, { patientId: "00000000-0000-0000-0000-000000000000" }), 403, "accountant safety denied");
  record.pass("receptionist and accountant cannot access clinical medication safety");

  const patient = await apiJson("POST", "/patients", owner, {
    medicalRecordNumber: `MED-DEMO-${Date.now()}`,
    firstName: "Demo",
    lastName: "Medication"
  });
  const medication = await apiJson("POST", `/patients/${patient.id}/medications`, doctor, {
    displayName: "Demo ACE ingredient",
    genericName: "Demo ACE ingredient",
    strengthText: "10 mg tablet",
    dosageForm: "tablet"
  });
  if (!medication.id) throw new Error("patient medication was not created");
  record.pass("patient medication add");

  const allergy = await apiJson("POST", `/patients/${patient.id}/allergies`, doctor, {
    displayName: "Demo ACE ingredient",
    reactionText: "Demo reaction for testing only",
    severity: "major"
  });
  if (!allergy.id) throw new Error("patient allergy was not created");
  record.pass("patient allergy add");

  const safety = await apiJson("POST", "/medications/safety-check", doctor, {
    patientId: patient.id,
    medications: [{ displayName: "Demo ACE ingredient", genericName: "Demo ACE ingredient" }]
  });
  const critical = safety.alerts?.find((alert) => alert.severity === "critical");
  if (!critical) throw new Error("allergy safety alert was not generated");
  record.pass("safety check creates allergy alert");

  assertStatus(await apiStatus("POST", `/medications/safety-alerts/${critical.id}/override`, doctor, {}), 400, "override requires reason");
  await apiJson("POST", `/medications/safety-alerts/${critical.id}/override`, doctor, { reason: "Demo doctor-reviewed override reason for test." });
  record.pass("critical alert override requires reason and remains auditable");

  const market = await apiJson("POST", "/drug-market/search", doctor, { query: "FolicPlus Gulf" });
  const gulf = market.products?.find((product) => product.tradeName === "FolicPlus Gulf");
  if (!gulf?.badges?.includes("KSA") || !gulf.badges.includes("UAE")) throw new Error("KSA+UAE compact badges missing");
  record.pass("KSA and UAE badges appear when Egypt is absent");

  const egypt = await apiJson("POST", "/drug-market/search", doctor, { query: "DemoCillin EG" });
  const eg = egypt.products?.find((product) => product.tradeName === "DemoCillin EG");
  if (!eg || eg.badges?.length) throw new Error("Egypt product should not show compact country badge");
  record.pass("Egypt product hides compact badge");

  const strength = await apiJson("POST", "/drug-market/search", doctor, { query: "457 mg/5 mL" });
  const suspension = strength.products?.find((product) => product.tradeName === "DemoSuspension");
  if (!suspension?.variantSummary?.some((variant) => variant.strengthText === "457 mg/5 mL oral suspension")) {
    throw new Error("Drug market strength search did not find DemoSuspension oral suspension variant.");
  }
  record.pass("drug market search by strength finds multi-strength product");

  assertStatus(await apiStatus("POST", "/drug-market/import/upload", reception, { rows: [] }), 403, "non-admin import denied");
  record.pass("non-admin cannot import");

  const connectors = await apiJson("GET", "/drug-market/automation/connectors", owner);
  const retail = connectors.find((connector) => connector.code === "RETAIL_PUBLIC_METADATA_CONNECTOR_TEMPLATE");
  if (!retail || retail.enabled !== false) throw new Error("retail metadata connector is not disabled by default");
  assertStatus(await apiStatus("POST", `/drug-market/automation/connectors/${retail.id}/run`, owner, {}), 400, "disabled retail connector blocked");
  record.pass("retail connector disabled and blocked by policy");

  const medPage = await readFile("apps/web/app/medications/page.tsx", "utf8");
  const marketPage = await readFile("apps/web/app/drug-market/page.tsx", "utf8");
  for (const forbidden of ["checkout", "cart"]) {
    if (medPage.toLowerCase().includes(forbidden) || marketPage.toLowerCase().includes(forbidden)) {
      throw new Error(`forbidden retail wording found: ${forbidden}`);
    }
  }
  record.pass("new medication pages avoid retail workflow wording");

  record.summary();
}

function assertHasResult(body, type, text) {
  const found = body.results?.some((item) => item.type === type && JSON.stringify(item).toLowerCase().includes(text.toLowerCase()));
  if (!found) throw new Error(`Expected ${type} result containing ${text}`);
  const missingIdentity = body.results?.some((item) => ["ingredient", "product", "market_variant"].includes(item.type) && !("genericName" in item));
  if (missingIdentity) throw new Error("Medication result is missing genericName field");
}

await main().catch((error) => {
  record.fail(error.message);
  record.summary();
  process.exit(1);
});
