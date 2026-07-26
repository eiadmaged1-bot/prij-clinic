import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const output = path.join(root, "scripts/sprint1-patient-safety-core-test.mjs");

const test = `import fs from "node:fs";

const doctorDto = fs.readFileSync("apps/api/src/doctor-visit/dto.ts", "utf8");
const doctorService = fs.readFileSync("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8");
const encounterDto = fs.readFileSync("apps/api/src/encounters/dto.ts", "utf8");
const encounterController = fs.readFileSync("apps/api/src/encounters/encounters.controller.ts", "utf8");
const encounterService = fs.readFileSync("apps/api/src/encounters/encounters.service.ts", "utf8");
const client = fs.readFileSync("apps/web/lib/doctor-visit.ts", "utf8");
const workspace = fs.readFileSync("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8");
const identity = fs.readFileSync("apps/web/components/clinic/PatientVisitIdentityBar.tsx", "utf8");

const checks = [
  ["draft version DTO", doctorDto, "expectedUpdatedAt?: string;"],
  ["stale-save code", doctorService, 'code: "VISIT_DRAFT_STALE"'],
  ["atomic draft update", doctorService, "this.prisma.encounter.updateMany"],
  ["draft state condition", doctorService, 'status: "draft"'],
  ["expected version condition", doctorService, "updatedAt: expectedUpdatedAt"],
  ["sign DTO", encounterDto, "export class SignEncounterDto"],
  ["sign patient ID", encounterDto, "patientId!: string;"],
  ["sign permission", encounterController, '@Permissions("encounter.sign")'],
  ["sign body", encounterController, "@Body() dto: SignEncounterDto"],
  ["context-bound sign", encounterController, "this.encounters.sign(id, dto.patientId, user)"],
  ["scoped encounter sign", encounterService, "assertCanReferenceEncounter(this.prisma, id, user, { patientId, requireDoctorScope: true })"],
  ["atomic sign claim", encounterService, "tx.encounter.updateMany"],
  ["sign conflict code", encounterService, 'code: "ENCOUNTER_SIGN_CONFLICT"'],
  ["signed replay", encounterService, "replayed: true"],
  ["atomic audit marker", encounterService, "atomicClaim: true"],
  ["versioned client save", client, "expectedUpdatedAt?: string"],
  ["patient-bound client sign", client, "completeDoctorVisit(patientId: string, encounterId: string)"],
  ["sign body patient ID", client, "JSON.stringify({ patientId })"],
  ["patient match gate", workspace, "encounter?.patientId === patientId"],
  ["loaded context mismatch gate", workspace, "loadedPatientId !== patientId || loadedEncounterId !== visitId || loadedEncounterPatientId !== patientId"],
  ["finish intent", workspace, "finishIntent"],
  ["sign confirmation title", workspace, "Sign and lock this visit?"],
  ["identity confirmation warning", workspace, "Confirm the patient identity before continuing"],
  ["MRN confirmation", workspace, "<strong>MRN:</strong>"],
  ["visit ID confirmation", workspace, "<strong>Visit ID:</strong>"],
  ["context-bound client sign call", workspace, "completeDoctorVisit(patientId, visitId)"],
  ["versioned save call", workspace, 'String(encounter?.updatedAt ?? "")'],
  ["signed read-only boundary", workspace, "Signed visit · read only"],
  ["signed module notice", workspace, "SignedVisitReadOnlyNotice"],
  ["locked identity bar", identity, "data-locked-patient-bar"]
];

for (const [label, source, needle] of checks) {
  if (!source.includes(needle)) throw new Error(\`Sprint 1 patient safety contract missing: \${label} -> \${needle}\`);
}
if (workspace.includes("PatientPicker")) throw new Error("Active visit workspace must never render a patient picker.");
if ((encounterService.match(/tx\\.encounter\\.updateMany/g) ?? []).length < 1) throw new Error("Atomic signing claim is missing.");
if ((doctorService.match(/encounter\\.updateMany/g) ?? []).length < 1) throw new Error("Optimistic draft-save claim is missing.");

console.log("Sprint 1 patient safety core PASS");
`;

fs.writeFileSync(output, test, "utf8");
console.log("Sprint 1 patient safety contract test stabilized.");
