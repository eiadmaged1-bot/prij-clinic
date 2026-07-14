import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const scanner = read("apps/web/app/reception/qr-scan/page.tsx");
const patientQrModal = read("apps/web/app/patients/[id]/patient-components.tsx");
const patientsController = read("apps/api/src/patients/patients.controller.ts");
const patientsService = read("apps/api/src/patients/patients.service.ts");
const queueController = read("apps/api/src/queue/queue.controller.ts");
const migration = read("apps/api/prisma/migrations/20260714190000_patient_permanent_qr_token/migration.sql");

assert.match(patientQrModal, /qr-token/);
assert.match(patientQrModal, /patientQrSvgDataUri\(payload\)/);
assert.doesNotMatch(patientQrModal, /patientQrSvgDataUri\(patient\.id\)/);
assert.doesNotMatch(patientQrModal, /data-qr-payload=\{patient\.id\}/);
assert.match(patientQrModal, /opaque lookup token only/);

assert.match(scanner, /window\.isSecureContext/);
assert.match(scanner, /cameraCapability !== "ready"/);
assert.match(scanner, /facingMode: "environment"/);
assert.match(scanner, /BarcodeDetector/);
assert.match(scanner, /PRIJ-PATIENT:/);
assert.match(scanner, /invalidOrExpiredToken/);
assert.match(scanner, /QR token, MRN\/file number, phone, or name/);
assert.match(scanner, /\/queue\/check-in/);

assert.match(patientsController, /@UseGuards\(JwtAuthGuard, PermissionsGuard\)/);
assert.match(patientsController, /@Get\(":id\/qr"\)/);
assert.match(patientsController, /@Get\(":id\/qr-token"\)/);
assert.match(patientsController, /@Permissions\("patient\.read"\)/);
assert.match(patientsService, /action: "patient\.qr_resolved"/);
assert.match(patientsService, /action: "patient\.qr_viewed"/);
assert.match(patientsService, /lookupType: trimmed\.startsWith/);
assert.match(queueController, /@Permissions\("queue\.manage"\)/);
assert.match(migration, /ADD COLUMN "qrToken" UUID/);
assert.match(migration, /CREATE UNIQUE INDEX "Patient_qrToken_key"/);

console.log("V101-QR SUMMARY PASS 23 WARN 0 FAIL 0");
