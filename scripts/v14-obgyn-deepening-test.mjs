import { readFile } from "node:fs/promises";

const checks = [];
const failures = [];

try {
  await checkPregnancyFetusAntenatalUltrasound();
  await checkBackendContracts();
  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`V14-OBGYN-DEEPENING PASS ${JSON.stringify({ checks })}`);
} catch (error) {
  throw error;
}

async function checkPregnancyFetusAntenatalUltrasound() {
  const page = await read("apps/web/app/patients/[id]/page.tsx");
  for (const text of [
    'label: "Pregnancy"',
    'label: "Ultrasound"',
    "Create pregnancy record",
    "LMP",
    "EDD",
    "Dating method",
    "Gravida",
    "Para",
    "Fetus starter",
    "Chorionicity",
    "Amnionicity",
    "Antenatal Visits",
    "BP",
    "Weight",
    "Urine protein",
    "Fetal heart",
    "Next follow-up date",
    "OB ultrasound report builder",
    "BPD",
    "HC",
    "AC",
    "FL",
    "EFW",
    "Doppler note"
  ]) {
    assertIncludes(page, text, `OB/GYN UI ${text}`);
  }
  checks.push("pregnancy, fetus, antenatal, and ultrasound screens render required fields");
}

async function checkBackendContracts() {
  const dto = await read("apps/api/src/pregnancy/dto.ts");
  const service = await read("apps/api/src/pregnancy/pregnancy.service.ts");
  for (const field of ["lmpDate", "estimatedDueDate", "datingMethod", "gravida", "para", "living", "abortions", "chorionicity", "amnionicity", "bloodPressure", "weightKg", "urineProtein", "symptomsText", "planText", "bpdMm", "hcMm", "acMm", "flMm", "efwGrams", "dopplerNote"]) {
    assertIncludes(dto + service, field, `backend field ${field}`);
  }
  for (const audit of ["pregnancy.created", "pregnancy_fetus.created", "antenatal_visit.created", "ob_ultrasound.created"]) {
    assertIncludes(service, audit, `audit event ${audit}`);
  }
  checks.push("backend OB/GYN contracts and audit events exist");
}

async function read(path) {
  return readFile(path, "utf8");
}

function assertIncludes(source, needle, message) {
  assert(source.includes(needle), `${message}: missing ${needle}`);
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
