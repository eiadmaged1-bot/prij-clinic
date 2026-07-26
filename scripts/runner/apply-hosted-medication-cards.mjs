import { readFile, writeFile } from "node:fs/promises";

const visitPath = "apps/web/components/clinic/ActiveVisitWorkspace.tsx";
const cssPath = "apps/web/app/globals.css";

let visit = await readFile(visitPath, "utf8");
let css = await readFile(cssPath, "utf8");

if (!visit.includes('function MedicationCard({ result, onAdd }')) {
  throw new Error("MedicationCard function not found in current visit workspace.");
}

visit = visit.replace(
  /<div className="data-list wide">\s*\{results\.map\(\(result\) => <MedicationCard key=\{`\$\{result\.type\}-\$\{result\.id\}`\} result=\{result\} onAdd=\{\(\) => onAdd\(result\)\} \/>\)\}/,
  '<div className="medication-result-grid wide">\n        {results.map((result) => <MedicationCard key={`${result.type}-${result.id}`} result={result} onAdd={() => onAdd(result)} />)}'
);

if (!visit.includes('className="medication-result-grid wide"')) {
  throw new Error("Medication result grid replacement failed.");
}

const cardStart = visit.indexOf('function MedicationCard({ result, onAdd }');
const cardEnd = visit.indexOf('\nfunction TemplateStrip(', cardStart);
if (cardStart < 0 || cardEnd < 0) throw new Error("MedicationCard boundaries not found.");

const cardReplacement = `function MedicationCard({ result, onAdd }: { result: MedicationResult; onAdd: () => void }) {
  const tradeName = result.tradeName ?? result.brandName ?? result.genericName ?? "Medication";
  const genericName = result.genericName ?? "Generic not recorded";
  const coreMeta = [result.strengthText, result.dosageForm, result.route].filter(Boolean).join(" · ") || "Strength, form, and route not recorded";
  const classifications = [result.family, result.therapeuticClass, result.pharmacologicClass].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);
  return (
    <article className="medication-result-card compact-medication-card">
      <div className="compact-medication-card-main">
        <strong className="medication-trade-name">{tradeName}</strong>
        <span className="medication-generic-name">{genericName}</span>
        <span className="medication-core-meta">{coreMeta}</span>
      </div>
      <div className="medication-classification-chips" aria-label="Medication classification">
        {classifications.length ? classifications.slice(0, 3).map((value) => <span className="badge" key={String(value)}>{value}</span>) : <span className="badge">Medication</span>}
      </div>
      <div className="medication-safety-chips" aria-label="Medication safety review">
        <span className="badge">Pregnancy: {reviewLabel(result.reviewFlags?.pregnancy)}</span>
        <span className="badge">Lactation: {reviewLabel(result.reviewFlags?.lactation)}</span>
      </div>
      <button className="button compact" type="button" onClick={onAdd}>Add to prescription</button>
    </article>
  );
}
`;

visit = visit.slice(0, cardStart) + cardReplacement + visit.slice(cardEnd);

const marker = "/* QA-MED-001 compact medication-result cards */";
if (!css.includes(marker)) {
  css += `\n\n${marker}
.medication-result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: .55rem;
  max-height: 15rem;
  overflow: auto;
  align-items: stretch;
  padding: .1rem;
}
.compact-medication-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "main action" "class action" "safety action";
  align-items: center;
  gap: .35rem .55rem;
  min-width: 0;
  min-height: 7.4rem;
  padding: .65rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.compact-medication-card-main { grid-area: main; display: grid; gap: .1rem; min-width: 0; }
.medication-trade-name { overflow: hidden; color: var(--navy, #0f2744); font-size: 1rem; line-height: 1.15; text-overflow: ellipsis; white-space: nowrap; }
.medication-generic-name { overflow: hidden; color: var(--foreground); font-size: .82rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.medication-core-meta { overflow: hidden; color: var(--muted); font-size: .75rem; text-overflow: ellipsis; white-space: nowrap; }
.medication-classification-chips { grid-area: class; display: flex; flex-wrap: wrap; gap: .25rem; min-width: 0; }
.medication-safety-chips { grid-area: safety; display: flex; flex-wrap: wrap; gap: .25rem; min-width: 0; }
.medication-classification-chips .badge,
.medication-safety-chips .badge { max-width: 100%; padding: .18rem .38rem; overflow: hidden; font-size: .68rem; text-overflow: ellipsis; white-space: nowrap; }
.compact-medication-card > .button { grid-area: action; align-self: stretch; min-width: 6.4rem; padding-inline: .55rem; }
@media (max-width: 640px) {
  .medication-result-grid { grid-template-columns: minmax(0, 1fr); max-height: 18rem; }
  .compact-medication-card { grid-template-columns: minmax(0, 1fr); grid-template-areas: "main" "class" "safety" "action"; }
  .compact-medication-card > .button { min-height: 42px; }
}
`;
}

await writeFile(visitPath, visit, "utf8");
await writeFile(cssPath, css, "utf8");
console.log("Applied hosted compact medication-card repair.");