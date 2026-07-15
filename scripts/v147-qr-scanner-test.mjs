import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, patientService, queue] = await Promise.all([
  readFile("apps/web/app/reception/qr-scan/page.tsx", "utf8"),
  readFile("apps/api/src/patients/patients.service.ts", "utf8"),
  readFile("apps/api/src/queue/queue.service.ts", "utf8")
]);

assert.match(page, /window\.isSecureContext/);
assert.match(page, /disabled=\{cameraCapability !== "ready"\}/);
assert.match(page, /facingMode: \{ ideal: "environment" \}/);
assert.match(page, /BarcodeDetector/);
assert.match(page, /await import\("jsqr"\)/);
assert.match(page, /\^PRIJ-PATIENT:\[0-9a-f-\]\{36\}\$/);
assert.match(page, /PatientPicker/);
assert.match(page, /onPatientSelect/);
assert.match(page, /Confirm Check-in/);
assert.match(page, /streamRef\.current\?\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
assert.match(page, /return stopCamera/);
assert.match(page, /Camera scanning requires HTTPS/);
assert.match(page, /Camera permission denied/);
assert.match(page, /Scanner failed/);
assert.match(page, /رمز QR الدائم للمريضة/);
assert.match(patientService, /payload: `PRIJ-PATIENT:\$\{patient\.qrToken\}`/);
assert.match(queue, /activeQueueTicketLock\.create/);

console.log("v1.4.7 cross-browser permanent QR flow PASS (17 assertions)");
