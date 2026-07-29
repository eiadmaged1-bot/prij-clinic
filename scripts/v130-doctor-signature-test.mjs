import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V130-DOCTOR-SIGNATURE PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const schema = await readFile("apps/api/prisma/schema.prisma", "utf8");
const doctorVisit = await readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8");
const patientPage = `${await readFile("apps/web/app/patients/[id]/patient-components.tsx", "utf8")}\n${await readFile("apps/web/app/patients/[id]/timeline-components.tsx", "utf8")}`;
const css = await readFile("apps/web/app/globals.css", "utf8");

assert(schema.includes("doctorColor") && schema.includes("doctorShortLabel"), "doctor color fields missing");
pass("doctor color field exists");
assert(schema.includes("startedByUserId") && schema.includes("doctorDisplayNameSnapshot") && schema.includes("doctorColorSnapshot") && schema.includes("startedAt"), "encounter signature fields missing");
pass("encounter stores doctor signature snapshot");
assert(doctorVisit.includes("startedByUserId: user.id") && doctorVisit.includes("doctorDisplayNameSnapshot: doctorProfile.displayName"), "start visit does not stamp authenticated user");
pass("Start Visit stamps authenticated doctor");
assert(doctorVisit.includes("VISIT_DOCTOR_SIGNATURE_ASSIGNED") && doctorVisit.includes("DOCTOR_VISIT_STARTED"), "doctor signature audit event missing");
pass("doctor signature audit event exists");
assert(patientPage.includes("DoctorSignatureBadge") && patientPage.includes("Seen by") && css.includes("doctor-signature-badge"), "timeline doctor signature UI missing");
pass("timeline shows doctor name and color marker");
assert(patientPage.includes("doctorSignature") && patientPage.includes("doctorColor"), "color is not paired with doctor identifier");
pass("color is not the only identifier");
assert(!doctorVisit.includes("Dr. Eyad") && !doctorVisit.includes("Dr. Maged"), "hard-coded doctor name found");
pass("no hard-coded doctor names");

console.log(`V130-DOCTOR-SIGNATURE SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
