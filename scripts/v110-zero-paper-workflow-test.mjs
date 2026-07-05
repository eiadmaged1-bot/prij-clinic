import { readFile } from "node:fs/promises";

const checks = [];

async function main() {
  const reception = await read("apps/web/app/reception/page.tsx");
  const checkIn = await read("apps/web/app/reception/check-in/page.tsx");
  const qr = await read("apps/web/app/reception/qr-scan/page.tsx");
  const newPatient = await read("apps/web/app/patients/new/page.tsx");
  const patientFile = await read("apps/web/app/patients/[id]/page.tsx");
  const doctor = await read("apps/web/app/doctor/page.tsx");
  const schema = await read("apps/api/prisma/schema.prisma");
  const queueDto = await read("apps/api/src/queue/dto.ts");
  const queueService = await read("apps/api/src/queue/queue.service.ts");
  const visitTypes = await read("apps/web/lib/visit-types.ts");

  assertIncludes(reception, ["Waiting List", "New Patient", "Returning Patient", "Scan QR", "Quick check-in"], "receptionist cockpit actions render");
  assertNotIncludes(reception, ["total patients today", "total patients yesterday", "total visits this week", "paymentsToday"], "reception cockpit hides analytics and finance totals");
  assertIncludes(reception, ["patient name, phone number, patient ID, or medical record number", "Add to queue", "VisitTypeSelector"], "returning patient lookup supports zero-paper check-in");
  assertIncludes(newPatient, ["possibleDuplicateWarnings", "duplicate-patient-warning", "VisitTypeSelector", "queue/check-in"], "new patient duplicate warning and check-in source exists");
  assertIncludes(checkIn, ["Select visit type first", "visitType", "VisitTypeSelector"], "check-in requires visit type");
  assertIncludes(qr, ["Select visit type first", "visitType", "Check in / Add to queue"], "QR check-in requires visit type");
  assertIncludes(schema, ["enum VisitType", "kashf", "recheck", "consultation", "urgent_kashf", "visitType     VisitType"], "QueueTicket stores required visit type");
  assertIncludes(queueDto, ["VisitType", "@IsEnum(VisitType)", "visitType!"], "queue DTO validates visit type");
  assertIncludes(queueService, ["Visit type is required before check-in.", "visitType: dto.visitType", "queue.checked_in"], "queue service enforces and audits visit type");
  assertIncludes(visitTypes, ["كشف", "إعادة", "استشارة", "مستعجل", "urgent: true"], "four Arabic labels and urgent value are defined");
  assertIncludes(doctor, ["Visit type counts", "visitTypeLabel", "كشف", "إعادة", "استشارة", "مستعجل"], "doctor waiting counts and badges render");
  assertIncludes(patientFile, ["PatientQuickActions", "Add visit", "Add prescription", "Request investigation", "Add payment", "Upload document placeholder", "Print packet", "Book follow-up", "Show QR", "Add consent placeholder"], "patient quick actions render");
  assertIncludes(patientFile, ["Clinical", "Billing", "Documents", "Pregnancy", "Gynecology", "Investigations", "AI drafts", "Queue/appointments"], "patient timeline filters render");
  assertIncludes(patientFile, ["old report", "lab result", "ultrasound report", "consent form", "referral letter", "operation report", "previous prescription"], "document placeholders render");
  assertIncludes(patientFile, ["general clinic consent", "procedure consent", "ultrasound/media consent", "data/privacy consent", "future AI-assistance consent placeholder"], "consent placeholders render");
  assertNotIncludes(`${reception}${checkIn}${newPatient}${patientFile}${doctor}`, ["schema.prisma", "JWT", "stack trace"], "normal UI avoids code-like wording");

  passSummary("V110-ZERO-PAPER");
}

async function read(path) {
  return readFile(path, "utf8");
}

function assertIncludes(source, needles, label) {
  const missing = needles.filter((needle) => !source.includes(needle));
  if (missing.length) throw new Error(`${label}: missing ${missing.join(", ")}`);
  checks.push(label);
  console.log(`V110-ZERO-PAPER PASS ${label}`);
}

function assertNotIncludes(source, needles, label) {
  const found = needles.filter((needle) => source.toLowerCase().includes(needle.toLowerCase()));
  if (found.length) throw new Error(`${label}: found ${found.join(", ")}`);
  checks.push(label);
  console.log(`V110-ZERO-PAPER PASS ${label}`);
}

function passSummary(prefix) {
  console.log(`${prefix} SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

await main().catch((error) => {
  console.error(`V110-ZERO-PAPER FAIL ${error.message}`);
  process.exitCode = 1;
});
