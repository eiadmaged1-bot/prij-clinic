import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const file = path.join(root, "apps/web/app/globals.css");
let css = await readFile(file, "utf8");
const marker = "/* QA-RX-001 QA-RX-002 structured prescription controls */";
if (css.includes(marker)) throw new Error("Structured prescription CSS already exists");
css += `

${marker}
.structured-prescription-list { gap: .65rem; }
.structured-prescription-line { display: grid; gap: .55rem; padding: .7rem; }
.rx-control-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: .5rem;
  align-items: end;
}
.rx-control-grid label { min-width: 0; }
.rx-control-grid input,
.rx-control-grid select { min-height: 36px; }
.rx-control-grid .rx-note { grid-column: 1 / -1; }
.rx-control-grid .rx-note textarea { min-height: 58px; resize: vertical; }
.rx-quick-presets { display: flex; flex-wrap: wrap; gap: .35rem; }
@media (max-width: 900px) {
  .rx-control-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .rx-control-grid { grid-template-columns: minmax(0, 1fr); }
  .rx-control-grid .rx-note { grid-column: auto; }
  .rx-quick-presets .button { flex: 1 1 calc(50% - .35rem); }
}
`;
await writeFile(file, css, "utf8");
console.log("Applied structured prescription CSS patch");
