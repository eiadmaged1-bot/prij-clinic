import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [scanner, webPackage] = await Promise.all([
  readFile("apps/web/app/reception/qr-scan/page.tsx", "utf8"),
  readFile("apps/web/package.json", "utf8")
]);

assert.match(scanner, /window\.isSecureContext/, "insecure HTTP must disable camera use");
assert.match(scanner, /navigator\.mediaDevices\?\.getUserMedia/, "camera capability must be checked");
assert.match(scanner, /facingMode: "environment"/, "rear camera must be preferred");
assert.match(scanner, /videoRef[\s\S]*playsInline/, "scanner needs a visible mobile preview");
assert.match(scanner, /BarcodeDetector/, "native BarcodeDetector must be preferred");
assert.match(scanner, /import\("jsqr"\)/, "JavaScript decoder must load as fallback");
assert.match(scanner, /getImageData/, "fallback must decode actual camera frames");
assert.match(scanner, /PRIJ-PATIENT:\[0-9a-f-\]\{36\}/, "scanned payload must be a PHI-free permanent token");
for (const state of ["permissionNotRequested", "permissionDenied", "noCameraFound", "cameraStarted", "decoderLoading", "scanning", "invalidQr", "patientFound", "decoderFailed"]) {
  assert.ok(scanner.includes(state), `scanner state missing: ${state}`);
}
assert.match(scanner, /VisitTypeSelector/, "patient preview must precede explicit check-in");
assert.match(scanner, /disabled=\{cameraCapability !== "ready"\}/, "LAN HTTP camera action must be visibly disabled");
assert.match(scanner, /clinic-queue:changed/, "QR check-in must refresh queue consumers");
assert.equal(JSON.parse(webPackage).dependencies.jsqr, "^1.4.0", "jsQR must be an explicit web dependency");

console.log("v1.4.6 HTTPS QR fallback chain PASS (21 assertions)");
