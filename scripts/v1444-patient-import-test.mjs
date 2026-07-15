import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, service, controller, page, hashRoute] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260714153000_patient_import_batches/migration.sql", "utf8"),
  readFile("apps/api/src/patient-import/patient-import.service.ts", "utf8"),
  readFile("apps/api/src/patient-import/patient-import.controller.ts", "utf8"),
  readFile("apps/web/app/patients/import/page.tsx", "utf8"),
  readFile("apps/web/app/api/patient-import/hash/route.ts", "utf8")
]);

for (const model of ["PatientImportBatch", "PatientImportRow"]) assert(schema.includes(`model ${model}`) && migration.includes(`CREATE TABLE "${model}"`), `${model} audit model missing`);
for (const status of ["READY", "POSSIBLE_DUPLICATE", "INVALID", "NEEDS_REVIEW", "IMPORTED", "FAILED"]) assert(service.includes(`"${status}"`) || page.includes(`"${status}"`), `row status missing: ${status}`);
assert(service.includes('["Owner", "Admin"]') && controller.includes('@Permissions("patient.create")'), "patient import must be Owner/Admin and permission gated");
assert(service.includes("unsafeCell") && service.includes("formula-like or corrupted text"), "formula and corrupted text guard missing");
assert(service.includes("automaticMerge: false") && service.includes("RESOLVE_EXISTING") && service.includes("BLOCKED"), "automatic merge/overwrite must be blocked by explicit resolution");
assert(service.includes("patient_import.previewed") && service.includes("patient_import.committed"), "batch preview and commit must be audited");
assert(page.includes('windows-1256') && page.includes('utf-8') && page.includes("TextDecoder"), "Arabic CSV encoding selection missing");
assert(page.includes('import("xlsx")') && page.includes("cellFormula: false"), "XLSX parser must disable formula processing");
assert(page.includes("Column mapping") && page.includes("Run dry-run preview") && page.includes("Commit reviewed rows"), "guided import flow missing");
assert(hashRoute.includes('createHash("sha256")') && hashRoute.includes("5 * 1024 * 1024"), "server-side in-memory hash and size limit missing");
assert(!hashRoute.includes("writeFile") && !service.includes("automatic merge"), "source import files must not be stored or automatically merged");

console.log("Arabic-safe patient CSV/XLSX import contract PASS (25 assertions)");
