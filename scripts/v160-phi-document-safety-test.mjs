import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const packageJson = JSON.parse(read("package.json"));
const gitignore = read(".gitignore");
const imageSanitizer = read("apps/api/src/files/image-sanitizer.service.ts");
const fileStorage = read("apps/api/src/files/patient-file-storage.service.ts");
const documentsController = read("apps/api/src/patient-documents/patient-documents.controller.ts");
const documentsService = read("apps/api/src/patient-documents/patient-documents.service.ts");
const patientPage = read("apps/web/app/patients/[id]/page.tsx");
const printPacket = read("apps/web/app/patients/[id]/print/packet/page.tsx");
const doctorUiTest = read("scripts/doctor-friendly-ui-test.mjs");
const docs = read("docs/PHI_PII_DOCUMENT_SAFETY.md");

assert(packageJson.scripts["test:v160:phi-document-safety"] === "node scripts/v160-phi-document-safety-test.mjs", "PHI/document safety test script is registered");
assert(imageSanitizer.includes("metadataRemoved") && imageSanitizer.includes("removedMetadataTypes") && imageSanitizer.includes("sharp("), "image metadata sanitizer still exists");
assert(fileStorage.includes("ALLOWED_LOCAL_DEMO_NON_IMAGE_MIME_TYPES") && fileStorage.includes("Only sanitized images, PDFs, and plain text files"), "document upload allowlist exists");
assert(documentsController.includes("@UseGuards(JwtAuthGuard, PermissionsGuard)") && documentsController.includes('@Permissions("patient_document.read")'), "patient documents use backend auth and permission guards");
assert(documentsService.includes("assertCanReferencePatient") && documentsService.includes("patientId"), "patient document access remains patient-scoped by source guard pattern");

assert(!patientPage.includes("localDemoFilePath") && !patientPage.includes("fileSha256"), "normal patient UI does not show raw local storage paths or hashes");
assert(!printPacket.includes("localDemoFilePath") && !printPacket.includes("fileSha256"), "print packet avoids raw storage paths and hashes");
assert(!/(Created by ID|Patient ID|Encounter ID|Document ID|internal id)/i.test(printPacket), "print packet avoids internal/developer IDs where possible");
assert(doctorUiTest.includes("stack trace") && doctorUiTest.includes("Prisma") && doctorUiTest.includes("database error"), "error UI regression checks avoid technical internals");

for (const pattern of ["uploads/", "storage/*", "apps/api/uploads/", "apps/api/storage/", "*.pdf", "test-results/", "playwright-report/"]) {
  assert(gitignore.includes(pattern), `.gitignore excludes ${pattern}`);
}

const trackedFiles = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
const forbiddenTracked = trackedFiles.filter((file) =>
  /^(uploads|apps\/api\/uploads|apps\/api\/storage)\//.test(file) ||
  /^storage\/(?!README\.md$)/.test(file) ||
  /\.(pdf|xlsx|xls)$/i.test(file) ||
  /^(playwright-report|test-results|backups)\//.test(file)
);
assert(forbiddenTracked.length === 0, `no uploads/storage/PDF/Excel/report artifacts are committed (${forbiddenTracked.join(", ")})`);
assert(docs.includes("does not authorize real patient data") && docs.includes("Production storage"), "PHI/document safety docs state readiness limits");

console.log(`v0.16.0 PHI/document safety checks passed (${checks.length})`);
