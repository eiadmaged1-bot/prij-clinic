import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [service, controller, workspace, schema, migration] = await Promise.all([
  readFile("apps/api/src/drug-market/drug-market-import.service.ts", "utf8"),
  readFile("apps/api/src/drug-market/drug-market.controller.ts", "utf8"),
  readFile("apps/web/components/medications/MedicationImportWorkspace.tsx", "utf8"),
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260713231500_medication_import_run_link/migration.sql", "utf8")
]);

for (const format of [".csv", ".json", ".xlsx", ".xls"]) assert(workspace.includes(format), `manual import missing ${format}`);
assert(workspace.includes("Column mapping") && workspace.includes("Dry run") && workspace.includes("Import to review queue"), "mapping, preview, and commit workflow required");
assert(controller.includes('import/preview') && service.includes("drug_market.import_dry_run"), "dry run must be a no-write audited API operation");
assert(service.includes("duplicateCount") && service.includes("errors.slice(0, 100)"), "duplicate detection and bounded safe error reporting required");
assert(service.includes('verificationStatus: "needs_review"'), "imported medication rows must default to needs_review");
assert(service.includes('existing?.verificationStatus === "verified"') && service.includes("Manual review is required before changing verified metadata"), "verified rows must never be silently overwritten");
assert(service.includes("archiveImportJob") && service.includes('verificationStatus: "needs_review"') && service.includes("preservedVerifiedRows: true"), "safe rollback must archive only unverified rows");
assert(schema.includes("importRunId") && migration.includes("ADD COLUMN IF NOT EXISTS"), "import batch/run link requires a forward-only migration");
for (const provenance of ["sourceUrl", "sourceFileName", "sourceFetchedAt", "parserVersion", "verificationStatus"]) assert(service.includes(provenance), `missing provenance field: ${provenance}`);
assert(workspace.includes("Owner") && workspace.includes("drug_market.import") && workspace.includes("Do not upload patient data"), "import UI must be role-gated and state the source/privacy policy");

console.log("Medication CSV/Excel/JSON mapping, dry run, review queue, provenance, and safe archive PASS");
