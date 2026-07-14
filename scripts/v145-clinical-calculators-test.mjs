import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const engine = read("apps/api/src/calculators/medication-formula-engine.service.ts");
const service = read("apps/api/src/calculators/calculators.service.ts");
const controller = read("apps/api/src/calculators/calculators.controller.ts");
const workspace = read("apps/web/components/medications/PharmacologyWorkspace.tsx");
const schema = read("apps/api/prisma/schema.prisma");

assert.match(schema, /model DoseFormula[\s\S]*stableId[\s\S]*versions\s+FormulaVersion\[\]/, "formula identities and version history must remain explicit");
assert.match(schema, /model FormulaVersion[\s\S]*inputSchemaJson[\s\S]*validRangeJson[\s\S]*populationText[\s\S]*exclusionsJson[\s\S]*testCasesJson[\s\S]*roundingMethod/, "formula governance fields must remain present");
assert.match(controller, /@Post\("medication\/:stableId\/calculate"\)[\s\S]*@Permissions\("calculator\.calculate"\)/, "medication formula execution must use clinical calculator RBAC");
assert.match(service, /approvalStatus:\s*"approved"/, "only approved versions may be loaded");
assert.match(engine, /!version\.reviewerUserId/, "approval must include an attributable reviewer");
assert.match(engine, /verifyLockedTestCases/, "locked formula test cases must run before a clinical result");
assert.match(engine, /missing values are never inferred/, "missing values must not be inferred");
assert.match(engine, /outside the approved range/, "approved input ranges must be enforced");
assert.doesNotMatch(engine, /\beval\s*\(|new Function|Function\s*\(/, "formula execution must never evaluate stored code");
assert.match(service, /prescriptionInsertionPerformed:\s*false/, "calculator execution must not insert a prescription");
assert.match(service, /metadataJson:\s*\{ stableId:[^}]*formulaVersion:[^}]*approvalStatus:/, "audit metadata must identify the version without logging clinical inputs");
assert.match(workspace, /openFormula[\s\S]*aria-expanded/, "medication calculators must remain independently collapsed");
assert.match(workspace, /Pre-rounding[\s\S]*Rounding[\s\S]*Formula[\s\S]*Validated population[\s\S]*Exclusions[\s\S]*Limitations[\s\S]*Source/, "calculator results must expose governance, formula, and rounding details");
assert.match(workspace, /Results never auto-prescribe/, "UI must preserve the assistive-only safety statement");

console.log("v1.4.5 clinical calculator governance checks passed");
