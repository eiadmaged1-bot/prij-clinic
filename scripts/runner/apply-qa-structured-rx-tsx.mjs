import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const file = path.join(root, "apps/web/components/clinic/ActiveVisitWorkspace.tsx");
let source = await readFile(file, "utf8");

const typeStart = source.indexOf("type PrescriptionLine = {");
const typeEnd = source.indexOf("\n};", typeStart);
if (typeStart < 0 || typeEnd < 0) throw new Error("PrescriptionLine boundary not found");

const types = `type PrescriptionFrequencyCode = "q24h" | "q12h" | "q8h";
type PrescriptionDoseUnit = "tablet" | "capsule" | "sachet" | "mL" | "puff" | "drop" | "application";
type PrescriptionDurationUnit = "day" | "week";

type PrescriptionLine = {
  medicationName: string;
  medicationGenericId?: string;
  medicationProductId?: string;
  drugMarketVariantId?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  family?: string | null;
  manualEntry?: boolean;
  doseQuantity?: number;
  doseUnit?: PrescriptionDoseUnit;
  frequencyCode?: PrescriptionFrequencyCode;
  durationValue?: number;
  durationUnit?: PrescriptionDurationUnit;
  note?: string;
};

const PRESCRIPTION_FREQUENCY_OPTIONS = [
  { code: "q24h" as const, labelAr: "مرة يومياً", labelEn: "Once daily" },
  { code: "q12h" as const, labelAr: "مرتين يومياً (صباحاً ومساءً)", labelEn: "Twice daily" },
  { code: "q8h" as const, labelAr: "ثلاث مرات يومياً", labelEn: "Three times daily" }
];
const PRESCRIPTION_DOSE_UNITS: Array<{ value: PrescriptionDoseUnit; label: string }> = [
  { value: "tablet", label: "Tablet · قرص" },
  { value: "capsule", label: "Capsule · كبسولة" },
  { value: "sachet", label: "Sachet · كيس" },
  { value: "mL", label: "mL · مل" },
  { value: "puff", label: "Puff · بخة" },
  { value: "drop", label: "Drop · نقطة" },
  { value: "application", label: "Application · استعمال" }
];
const PRESCRIPTION_DURATION_MAX: Record<PrescriptionDurationUnit, number> = { day: 365, week: 52 };

function positiveInt(value: string | undefined, fallback = 1) {
  const parsed = Number(String(value ?? "").match(/\\d+/)?.[0] ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function frequencyCode(value: string | undefined): PrescriptionFrequencyCode {
  const text = String(value ?? "").toLowerCase();
  if (/q8h|three times|3 times|ثلاث/.test(text)) return "q8h";
  if (/q12h|twice|2 times|مرتين|صباح/.test(text)) return "q12h";
  return "q24h";
}
function durationUnit(value: string | undefined): PrescriptionDurationUnit {
  return /week|أسبوع/.test(String(value ?? "").toLowerCase()) ? "week" : "day";
}
function structuredLine(line: PrescriptionLine) {
  return {
    ...line,
    doseQuantity: line.doseQuantity ?? positiveInt(line.dose),
    doseUnit: line.doseUnit ?? "tablet" as PrescriptionDoseUnit,
    frequencyCode: line.frequencyCode ?? frequencyCode(line.frequency),
    durationValue: line.durationValue ?? positiveInt(line.duration),
    durationUnit: line.durationUnit ?? durationUnit(line.duration),
    note: line.note ?? line.instructions ?? ""
  };
}
function normalisePrescriptionLineForApi(line: PrescriptionLine): PrescriptionLine {
  const value = structuredLine(line);
  const timing = PRESCRIPTION_FREQUENCY_OPTIONS.find((item) => item.code === value.frequencyCode) ?? PRESCRIPTION_FREQUENCY_OPTIONS[0];
  const { doseQuantity, doseUnit, frequencyCode: _frequencyCode, durationValue, durationUnit: durationKind, note, ...rest } = value;
  const doseName = doseQuantity === 1 || doseUnit === "mL" ? doseUnit : doseUnit + "s";
  const durationName = durationValue === 1 ? durationKind : durationKind + "s";
  return {
    ...rest,
    dose: doseQuantity + " " + doseName + " per intake",
    frequency: timing.code + " · " + timing.labelAr,
    duration: durationValue + " " + durationName,
    instructions: note.trim() || undefined
  };
}`;
source = source.slice(0, typeStart) + types + source.slice(typeEnd + 3);

const addOld = `        family: result.family ?? result.therapeuticClass ?? result.pharmacologicClass
      }`;
const addNew = `        family: result.family ?? result.therapeuticClass ?? result.pharmacologicClass,
        doseQuantity: 1,
        doseUnit: "tablet",
        frequencyCode: "q24h",
        durationValue: 1,
        durationUnit: "day",
        note: ""
      }`;
if (!source.includes(addOld)) throw new Error("addMedication anchor not found");
source = source.replace(addOld, addNew);

const saveOld = `    const response = await apiPost("/prescriptions", { patientId, encounterId: visitId, sourceType: "manual", items: lines });`;
const saveNew = `    const response = await apiPost("/prescriptions", { patientId, encounterId: visitId, sourceType: "manual", items: lines.map(normalisePrescriptionLineForApi) });`;
if (!source.includes(saveOld)) throw new Error("savePrescription anchor not found");
source = source.replace(saveOld, saveNew);

const start = source.indexOf("function PrescriptionModule(");
const end = source.indexOf("\nfunction MedicationCard(", start);
if (start < 0 || end < 0) throw new Error("PrescriptionModule boundary not found");
const moduleText = `function PrescriptionModule({ query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }: { query: string; setQuery: (value: string) => void; results: MedicationResult[]; lines: PrescriptionLine[]; setLines: (updater: (current: PrescriptionLine[]) => PrescriptionLine[]) => void; onAdd: (result: MedicationResult) => void; onSave: () => void; onSafety: () => void; safety: Record<string, unknown> | null; templates: Record<string, unknown>[]; shortcuts: Record<string, unknown>[] }) {
  return (
    <div className="form-grid">
      <label className="wide">Medication search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="generic, brand, class, painkiller, antibiotic, nausea, thyroid, iron" /></label>
      <div className="medication-result-grid wide">
        {results.map((result) => <MedicationCard key={\`${result.type}-${result.id}\`} result={result} onAdd={() => onAdd(result)} />)}
        {query.trim().length < 2 ? <p className="empty-state compact smart-empty-state">Search medication catalog first.</p> : null}
      </div>
      <TemplateStrip templates={templates} shortcuts={shortcuts} setLines={setLines} />
      <div className="wide data-list structured-prescription-list">
        {lines.map((line, index) => {
          const value = structuredLine(line);
          const maxDuration = PRESCRIPTION_DURATION_MAX[value.durationUnit];
          return <article className="data-row structured-prescription-line" key={\`${line.medicationName}-${index}\`}>
            <div className="data-row-header"><strong>{line.medicationName}</strong><button className="button secondary compact" type="button" onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>
            <div className="rx-control-grid">
              <label>Quantity per intake<input type="number" min={1} max={12} step={1} value={value.doseQuantity} onChange={(event) => setLines((current) => updateLine(current, index, { doseQuantity: Math.min(12, Math.max(1, Number(event.target.value) || 1)) }))} /></label>
              <label>Dose unit<select value={value.doseUnit} onChange={(event) => setLines((current) => updateLine(current, index, { doseUnit: event.target.value as PrescriptionDoseUnit }))}>{PRESCRIPTION_DOSE_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select></label>
              <label>Timing · التوقيت<select value={value.frequencyCode} onChange={(event) => setLines((current) => updateLine(current, index, { frequencyCode: event.target.value as PrescriptionFrequencyCode }))}>{PRESCRIPTION_FREQUENCY_OPTIONS.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.labelAr} · {item.labelEn}</option>)}</select></label>
              <label>Duration value<input type="number" min={1} max={maxDuration} step={1} value={value.durationValue} onChange={(event) => setLines((current) => updateLine(current, index, { durationValue: Math.min(maxDuration, Math.max(1, Number(event.target.value) || 1)) }))} /></label>
              <label>Duration unit<select value={value.durationUnit} onChange={(event) => setLines((current) => updateLine(current, index, { durationUnit: event.target.value as PrescriptionDurationUnit }))}><option value="day">Day · يوم</option><option value="week">Week · أسبوع</option></select></label>
              <label className="wide rx-note">Optional note (the only free-text prescription field)<textarea value={value.note} onChange={(event) => setLines((current) => updateLine(current, index, { note: event.target.value }))} placeholder="Food relation, counselling, or clinician note" /></label>
            </div>
            <div className="rx-quick-presets">
              <button className="button secondary compact" type="button" onClick={() => setLines((current) => updateLine(current, index, { doseQuantity: 1, frequencyCode: "q24h" }))}>1 dose · q24h</button>
              <button className="button secondary compact" type="button" onClick={() => setLines((current) => updateLine(current, index, { doseQuantity: 1, frequencyCode: "q12h" }))}>1 dose · q12h</button>
              <button className="button secondary compact" type="button" onClick={() => setLines((current) => updateLine(current, index, { doseQuantity: 1, frequencyCode: "q8h" }))}>1 dose · q8h</button>
              <button className="button secondary compact" type="button" onClick={() => setLines((current) => updateLine(current, index, { doseQuantity: 2, doseUnit: "tablet", frequencyCode: "q24h" }))}>2 tablets together · q24h</button>
            </div>
          </article>;
        })}
        {!lines.length ? <p className="empty-state compact smart-empty-state">No medication lines yet.</p> : null}
      </div>
      <SafetyPanel safety={safety} />
      <div className="form-actions wide">
        <button className="button secondary" type="button" onClick={() => setLines((current) => [...current, structuredLine({ medicationName: "Custom medication", manualEntry: true })])}>Add custom medication</button>
        <button className="button secondary" type="button" disabled={!lines.length} onClick={onSafety}>Safety check</button>
        <button className="button" type="button" disabled={!lines.length} onClick={onSave}>Save draft</button>
        <button className="button secondary" type="button" disabled={!lines.length} onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}`;
source = source.slice(0, start) + moduleText + source.slice(end);

await writeFile(file, source, "utf8");
console.log("Applied structured prescription TSX patch");
