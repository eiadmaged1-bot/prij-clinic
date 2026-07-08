import { readFileSync } from "node:fs";

const checks = [];

function file(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function check(name, path, patterns) {
  const text = file(path);
  for (const pattern of patterns) {
    const ok = pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
    checks.push({ name: `${name}: ${String(pattern)}`, ok });
  }
}

function forbid(name, path, patterns) {
  const text = file(path);
  for (const pattern of patterns) {
    const found = pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
    checks.push({ name: `${name} forbids ${String(pattern)}`, ok: !found });
  }
}

check("topbar", "apps/web/app/mvp-page.tsx", [
  "OFFICIAL_CLINIC_NAME",
  "LanguageSwitcher",
  "topbar-logout-button",
  "icon-only-button"
]);

check("visit types", "apps/web/lib/visit-types.ts", [
  "استشارة",
  "كشف",
  "إعادة",
  "مستعجل"
]);

check("new patient", "apps/web/app/patients/new/page.tsx", [
  "Generate another file number",
  "readOnly",
  "Date of birth",
  "Year of birth",
  "Save and add to queue",
  "Save file only",
  "Open reception profile",
  "Unchecked = unknown / not asked."
]);

check("reception dashboard", "apps/web/app/reception/page.tsx", [
  "Search by name, phone, file number, QR",
  "Returning Patient / QR",
  "Appointments / Payments",
  "Waiting now",
  "Next patient not called yet",
  "Mark urgent",
  "Remove with reason"
]);

check("qr check-in", "apps/web/app/reception/qr-scan/page.tsx", [
  "Start camera scan",
  "Manual fallback",
  "QR must not contain sensitive medical data",
  "Add to today&apos;s queue",
  "Open file"
]);

check("queue board", "apps/web/app/clinic-operations-page.tsx", [
  "Reception Queue",
  "Next patient not called yet",
  "Call patient",
  "Cancel/remove with reason",
  "urgentRank",
  "!isReceptionistOnly",
  "Open reception profile"
]);

check("calendar receptionist safety", "apps/web/app/calendar/page.tsx", [
  "isReceptionistOnly",
  "Open reception profile",
  "!isReceptionistOnly ? <Link className=\"button compact\"",
  "isTrainingPatient",
  "visibleAppointments"
]);

check("patient reception profile", "apps/web/app/patients/[id]/page.tsx", [
  "ReceptionPatientProfile",
  "roleContextReady",
  "Reception Profile",
  "Needs consent",
  "No contact saved",
  "Follow-up due",
  "Payment pending",
  "Doctor-reviewed alert"
]);

check("doctor visit receptionist denial", "apps/web/app/doctor/visit/page.tsx", [
  "isReceptionistOnly",
  "Access denied",
  "Open reception profile"
]);

forbid("new patient pre-create actions", "apps/web/app/patients/new/page.tsx", [
  "Save and open file",
  "Open patient file"
]);

forbid("reception dashboard cleanup", "apps/web/app/reception/page.tsx", [
  "Messages",
  "Doctor view updated"
]);

forbid("broken placeholder markers", "apps/web/app/reception/page.tsx", [
  "broken-placeholder",
  "black-placeholder-bar"
]);

forbid("broken placeholder markers", "apps/web/app/patients/new/page.tsx", [
  "broken-placeholder",
  "black-placeholder-bar"
]);

check("patient directory", "apps/web/app/patients/page.tsx", [
  "Today&apos;s patients",
  "Obstetric / Pregnancy",
  "Follow-up due",
  "Load more",
  "Search by name, phone, MRN/file number, husband name, QR token"
]);

check("safe ai", "apps/web/components/ai-assistant/SafeAiAssistantPanel.tsx", [
  "Search patient first",
  "No preload",
  "Summarize patient history",
  "Medication/allergy review",
  "AI output is draft-only",
  "Draft-only, patient scoped, audited."
]);

check("investigations", "apps/web/app/investigations/page.tsx", [
  "Routine / Basic Women Health Labs",
  "Investigation Catalog Management",
  "No investigations in this category yet.",
  "Deactivated. Undo"
]);

check("smart clinical search", "apps/web/app/clinical-tags/page.tsx", [
  "Patient type / workflow",
  "Current pregnancy risks",
  "Medication-related",
  "Administrative / follow-up",
  "Aliases:",
  "Add to queue"
]);

const failed = checks.filter((item) => !item.ok);
if (failed.length) {
  console.error("v1.4 mobile productization contract failed:");
  for (const item of failed) console.error(`- ${item.name}`);
  process.exit(1);
}

console.log(`v1.4 mobile productization contract passed (${checks.length} checks).`);
