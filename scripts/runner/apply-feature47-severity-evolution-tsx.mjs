import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const file = path.join(root, "apps/web/components/clinic/ActiveVisitWorkspace.tsx");
let text = await readFile(file, "utf8");

const typeAnchor = 'type StructuredTagItem = { id?: string; label: string; category: string; status?: "Active" | "Improving" | "Resolved" | "Chronic" };';
const severityTypes = `${typeAnchor}\ntype ComplaintSeverity = "MILD" | "MODERATE" | "SEVERE";\ntype ComplaintSeveritySnapshot = {\n  severity: ComplaintSeverity;\n  recordedAt: string;\n  encounterId?: string;\n  recordedByUserId?: string;\n  provenance: "clinician_documented";\n};`;
if (!text.includes(typeAnchor)) throw new Error("Structured tag type anchor not found.");
text = text.replace(typeAnchor, severityTypes);

const inputAnchor = '  reproductiveSnapshot?: ReproductiveSnapshot;';
if (!text.includes(inputAnchor)) throw new Error("Structured input anchor not found.");
text = text.replace(inputAnchor, `${inputAnchor}\n  complaintSeveritySnapshot?: ComplaintSeveritySnapshot;`);

const callBefore = '<EncounterModule activeModule={activeModule} patientType={String(patient?.patientType ?? "")} form={encounterForm} previousEncounters={visit?.recentEncounters ?? []} pregnancyEpisode={visit?.pregnancyEpisode ?? null} infertilityEpisode={visit?.infertilityEpisode ?? null} readOnly={signedVisit} onChange={changeEncounterForm} onSubmit={saveEncounter} />';
const callAfter = '<EncounterModule activeModule={activeModule} patientType={String(patient?.patientType ?? "")} form={encounterForm} previousEncounters={visit?.recentEncounters ?? []} pregnancyEpisode={visit?.pregnancyEpisode ?? null} infertilityEpisode={visit?.infertilityEpisode ?? null} currentEncounterId={String(encounter?.id ?? "")} clinicianId={String(user?.id ?? "")} readOnly={signedVisit} onChange={changeEncounterForm} onSubmit={saveEncounter} />';
if (!text.includes(callBefore)) throw new Error("EncounterModule call anchor not found.");
text = text.replace(callBefore, callAfter);

const signatureBefore = 'function EncounterModule({ activeModule, patientType, form, previousEncounters, pregnancyEpisode, infertilityEpisode, readOnly, onChange, onSubmit }: { activeModule: string; patientType: string; form: Record<string, unknown>; previousEncounters: Record<string, unknown>[]; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null; readOnly: boolean; onChange: (next: Record<string, unknown>) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {';
const signatureAfter = 'function EncounterModule({ activeModule, patientType, form, previousEncounters, pregnancyEpisode, infertilityEpisode, currentEncounterId, clinicianId, readOnly, onChange, onSubmit }: { activeModule: string; patientType: string; form: Record<string, unknown>; previousEncounters: Record<string, unknown>[]; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null; currentEncounterId: string; clinicianId: string; readOnly: boolean; onChange: (next: Record<string, unknown>) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {';
if (!text.includes(signatureBefore)) throw new Error("EncounterModule signature anchor not found.");
text = text.replace(signatureBefore, signatureAfter);

const historyAnchor = `  const previousSnapshot = previousEncounters.flatMap((row) => {\n    const input = structuredInput(row.examinationJson);\n    return input.reproductiveSnapshot ? [{ ...input.reproductiveSnapshot, encounterId: input.reproductiveSnapshot.encounterId ?? String(row.id ?? "") }] : [];\n  })[0];`;
const historyAfter = `${historyAnchor}\n  const signedSeverityHistory = previousEncounters\n    .filter((row) => String(row.status ?? "").toLowerCase() === "signed")\n    .flatMap((row) => {\n      const snapshot = structuredInput(row.examinationJson).complaintSeveritySnapshot;\n      return snapshot ? [{ ...snapshot, encounterId: snapshot.encounterId ?? String(row.id ?? "") }] : [];\n    });\n  const currentSeverity = structured.complaintSeveritySnapshot;\n  const severityPoints = [...(readOnly && currentSeverity ? [currentSeverity] : []), ...signedSeverityHistory].slice(0, 3);`;
if (!text.includes(historyAnchor)) throw new Error("Previous snapshot anchor not found.");
text = text.replace(historyAnchor, historyAfter);

const lifecycleBlock = `      {activeModule === "complaint" ? (\n        <label>Lifecycle status\n          <select value={String(form.complaintStatus ?? "ACTIVE")} onChange={(event) => onChange({ ...form, complaintStatus: event.target.value })}>\n            {COMPLAINT_LIFECYCLE_STATUSES.map((status) => <option key={status} value={status}>{complaintStatusLabel(status)}</option>)}\n          </select>\n        </label>\n      ) : null}`;
const lifecycleAfter = `${lifecycleBlock}\n      {activeModule === "complaint" ? <ComplaintSeverityEditor value={currentSeverity} signedPoints={severityPoints} readOnly={readOnly} onChange={(severity) => updateStructured({ complaintSeveritySnapshot: { severity, recordedAt: new Date().toISOString(), encounterId: currentEncounterId || undefined, recordedByUserId: clinicianId || undefined, provenance: "clinician_documented" } })} /> : null}`;
if (!text.includes(lifecycleBlock)) throw new Error("Lifecycle status block anchor not found.");
text = text.replace(lifecycleBlock, lifecycleAfter);

const componentAnchor = '\nfunction PrescriptionModule({ query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }';
const severityComponent = `\nfunction ComplaintSeverityEditor({ value, signedPoints, readOnly, onChange }: { value?: ComplaintSeveritySnapshot; signedPoints: ComplaintSeveritySnapshot[]; readOnly: boolean; onChange: (severity: ComplaintSeverity) => void }) {\n  const labels: Record<ComplaintSeverity, string> = { MILD: "Mild", MODERATE: "Moderate", SEVERE: "Severe" };\n  return (\n    <section className="complaint-severity-editor wide" aria-label="Complaint severity">\n      <label>Complaint severity\n        <select disabled={readOnly} value={value?.severity ?? ""} onChange={(event) => onChange(event.target.value as ComplaintSeverity)}>\n          <option value="">Select severity</option>\n          <option value="MILD">Mild</option>\n          <option value="MODERATE">Moderate</option>\n          <option value="SEVERE">Severe</option>\n        </select>\n      </label>\n      <div className="complaint-severity-history" aria-label="Last three signed complaint severity points">\n        <strong>Last three signed points</strong>\n        <div>\n          {signedPoints.length ? signedPoints.map((point, index) => <span className="badge complaint-severity-point" key={\`${point.encounterId ?? point.recordedAt}-${index}\`}>{labels[point.severity]} · {new Date(point.recordedAt).toLocaleDateString()}</span>) : <span className="muted">No signed severity points yet.</span>}\n        </div>\n      </div>\n      {!readOnly && value ? <span className="badge">Current draft · excluded until signed</span> : null}\n      <p className="muted">Clinician-documented severity only. No automatic interpretation.</p>\n    </section>\n  );\n}\n`;
const componentIndex = text.indexOf(componentAnchor);
if (componentIndex < 0) throw new Error("PrescriptionModule component anchor not found.");
text = text.slice(0, componentIndex) + severityComponent + text.slice(componentIndex);

await writeFile(file, text, "utf8");
console.log("Applied Feature 47 complaint severity evolution TypeScript patch.");
