import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const doctorDto = read("apps/api/src/doctor-visit/dto.ts");
const doctorService = read("apps/api/src/doctor-visit/doctor-visit.service.ts");
const encounterDto = read("apps/api/src/encounters/dto.ts");
const encounterController = read("apps/api/src/encounters/encounters.controller.ts");
const encounterService = read("apps/api/src/encounters/encounters.service.ts");
const client = read("apps/web/lib/doctor-visit.ts");
const workspace = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const identity = read("apps/web/components/clinic/PatientVisitIdentityBar.tsx");
const copy = read("apps/web/i18n/operations-copy.ts");

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
  ["bilingual sign confirmation", workspace, "ui.signLockTitle"],
  ["bilingual identity warning", workspace, "ui.clinicalRecordLockHelp"],
  ["bilingual MRN confirmation", workspace, "ui.mrn"],
  ["bilingual visit ID confirmation", workspace, "ui.visitId"],
  ["context-bound client sign call", workspace, "completeDoctorVisit(patientId, visitId)"],
  ["versioned save call", workspace, 'String(encounter?.updatedAt ?? "")'],
  ["bilingual signed read-only boundary", workspace, "operationsUiCopy[language].signedReadOnly"],
  ["signed module notice", workspace, "SignedVisitReadOnlyNotice"],
  ["locked identity bar", identity, "data-locked-patient-bar"],
  ["English sign copy", copy, 'signLockTitle: "Sign and lock this visit?"'],
  ["Arabic sign copy", copy, 'signLockTitle: "توقيع وقفل هذه الزيارة؟"'],
  ["English identity warning copy", copy, 'clinicalRecordLockHelp: "Signing completes the queue visit'],
  ["Arabic identity warning copy", copy, 'clinicalRecordLockHelp: "التوقيع ينهي زيارة قائمة الانتظار']
];

for (const [label, source, needle] of checks) {
  if (!source.includes(needle)) throw new Error(`Sprint 1 bilingual patient safety contract missing: ${label} -> ${needle}`);
}
if (workspace.includes("PatientPicker")) throw new Error("Active visit workspace must never render a patient picker.");
if ((encounterService.match(/tx\.encounter\.updateMany/g) ?? []).length < 1) throw new Error("Atomic signing claim is missing.");
if ((doctorService.match(/encounter\.updateMany/g) ?? []).length < 1) throw new Error("Optimistic draft-save claim is missing.");
console.log("Sprint 1 bilingual patient safety core PASS");
