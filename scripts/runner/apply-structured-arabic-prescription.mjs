import { readFile, writeFile } from "node:fs/promises";

const visitPath = "apps/web/components/clinic/ActiveVisitWorkspace.tsx";
const cssPath = "apps/web/app/globals.css";

let visit = await readFile(visitPath, "utf8");
let css = await readFile(cssPath, "utf8");

const moduleStart = visit.indexOf("function PrescriptionModule(");
const moduleEnd = visit.indexOf("\nfunction MedicationCard(", moduleStart);
if (moduleStart < 0 || moduleEnd < 0) throw new Error("PrescriptionModule boundaries not found.");

const replacement = `const prescriptionDoseOptions = ["نصف قرص", "قرص", "قرصان", "5 مل", "10 مل", "تحميلة", "أمبول", "كبسولة"];
const prescriptionFrequencyOptions = ["مرة يوميًا", "مرتين يوميًا", "3 مرات يوميًا", "كل 6 ساعات", "كل 8 ساعات", "كل 12 ساعة", "عند اللزوم"];
const prescriptionDurationOptions = ["3 أيام", "5 أيام", "7 أيام", "10 أيام", "14 يومًا", "شهر", "حتى المراجعة"];
const prescriptionInstructionOptions = ["بعد الأكل", "قبل الأكل", "مع الأكل", "صباحًا", "مساءً", "قبل النوم", "عند اللزوم"];

function StructuredPrescriptionField({ label, arabicLabel, value, options, onChange }: { label: string; arabicLabel: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <fieldset className="structured-rx-field">
      <legend><span>{label}</span><span dir="rtl">{arabicLabel}</span></legend>
      <div className="structured-rx-options" role="group" aria-label={label}>
        {options.map((option) => <button className={value === option ? "rx-option active" : "rx-option"} key={option} type="button" onClick={() => onChange(option)}>{option}</button>)}
      </div>
      <input aria-label={\`Custom ${'${label}'}\`} dir="auto" value={value} onChange={(event) => onChange(event.target.value)} placeholder={\`Custom ${'${label}'} / إدخال مخصص\`} />
    </fieldset>
  );
}

function PrescriptionModule({ query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }: { query: string; setQuery: (value: string) => void; results: MedicationResult[]; lines: PrescriptionLine[]; setLines: (updater: (current: PrescriptionLine[]) => PrescriptionLine[]) => void; onAdd: (result: MedicationResult) => void; onSave: () => void; onSafety: () => void; safety: Record<string, unknown> | null; templates: Record<string, unknown>[]; shortcuts: Record<string, unknown>[] }) {
  return (
    <div className="form-grid structured-rx-workspace">
      <label className="wide">Medication search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="generic, brand, class, painkiller, antibiotic, nausea, thyroid, iron" /></label>
      <div className="medication-result-grid wide">
        {results.map((result) => <MedicationCard key={\`${'${result.type}'}-${'${result.id}'}\`} result={result} onAdd={() => onAdd(result)} />)}
        {query.trim().length < 2 ? <p className="empty-state compact smart-empty-state">Search medication catalog first.</p> : null}
      </div>
      <TemplateStrip templates={templates} shortcuts={shortcuts} setLines={setLines} />
      <div className="wide data-list structured-rx-lines">
        {lines.map((line, index) => (
          <article className="data-row structured-rx-line" key={\`${'${line.medicationName}'}-${'${index}'}\`}>
            <div className="data-row-header"><strong>{line.medicationName}</strong><button className="button secondary compact" type="button" onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>
            <div className="structured-rx-grid">
              <StructuredPrescriptionField label="Dose" arabicLabel="الجرعة" value={line.dose ?? ""} options={prescriptionDoseOptions} onChange={(value) => setLines((current) => updateLine(current, index, { dose: value }))} />
              <StructuredPrescriptionField label="Frequency" arabicLabel="عدد المرات" value={line.frequency ?? ""} options={prescriptionFrequencyOptions} onChange={(value) => setLines((current) => updateLine(current, index, { frequency: value }))} />
              <StructuredPrescriptionField label="Duration" arabicLabel="المدة" value={line.duration ?? ""} options={prescriptionDurationOptions} onChange={(value) => setLines((current) => updateLine(current, index, { duration: value }))} />
              <StructuredPrescriptionField label="Instructions" arabicLabel="التعليمات" value={line.instructions ?? ""} options={prescriptionInstructionOptions} onChange={(value) => setLines((current) => updateLine(current, index, { instructions: value }))} />
            </div>
            <p className="muted structured-rx-preview" dir="rtl">{[line.dose, line.frequency, line.duration, line.instructions].filter(Boolean).join(" · ") || "اختر الجرعة وعدد المرات والمدة والتعليمات"}</p>
          </article>
        ))}
        {!lines.length ? <p className="empty-state compact smart-empty-state">No medication lines yet.</p> : null}
      </div>
      <SafetyPanel safety={safety} />
      <div className="form-actions wide">
        <button className="button secondary" type="button" onClick={() => setLines((current) => [...current, { medicationName: "Custom medication", manualEntry: true }])}>Add custom medication</button>
        <button className="button secondary" type="button" disabled={!lines.length} onClick={onSafety}>Safety check</button>
        <button className="button" type="button" disabled={!lines.length} onClick={onSave}>Save draft</button>
        <button className="button secondary" type="button" disabled={!lines.length} onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}
`;

visit = visit.slice(0, moduleStart) + replacement + visit.slice(moduleEnd);

const marker = "/* RX-AR-001 structured Arabic prescription controls */";
if (!css.includes(marker)) {
  css += `\n\n${marker}
.structured-rx-lines { display: grid; gap: .7rem; }
.structured-rx-line { padding: .8rem; }
.structured-rx-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .55rem; }
.structured-rx-field { min-width: 0; margin: 0; padding: .55rem; border: 1px solid var(--border); border-radius: 10px; }
.structured-rx-field legend { display: flex; justify-content: space-between; gap: .5rem; width: 100%; padding: 0 .25rem; font-size: .78rem; font-weight: 800; }
.structured-rx-options { display: flex; flex-wrap: wrap; gap: .3rem; margin-bottom: .45rem; }
.rx-option { min-height: 34px; padding: .32rem .5rem; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); cursor: pointer; font: inherit; font-size: .76rem; }
.rx-option.active { border-color: var(--navy, #0f2744); background: var(--navy, #0f2744); color: white; }
.structured-rx-field input { width: 100%; }
.structured-rx-preview { margin: .5rem 0 0; text-align: right; font-weight: 700; }
@media (max-width: 760px) { .structured-rx-grid { grid-template-columns: minmax(0, 1fr); } .rx-option { min-height: 42px; } }
@media print { .structured-rx-options, .structured-rx-field input, .structured-rx-line .button { display: none !important; } .structured-rx-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;
}

await writeFile(visitPath, visit, "utf8");
await writeFile(cssPath, css, "utf8");
console.log("Applied structured Arabic prescription controls.");
