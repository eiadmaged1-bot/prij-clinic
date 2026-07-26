import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const file = path.join(root, "apps/web/app/globals.css");
let css = await readFile(file, "utf8");

const marker = "/* Feature 47 complaint severity evolution */";
if (css.includes(marker)) throw new Error("Feature 47 CSS already exists.");
css += `\n\n${marker}\n.complaint-severity-editor {\n  display: grid;\n  grid-template-columns: minmax(12rem, .8fr) minmax(0, 1.4fr) auto;\n  align-items: end;\n  gap: .55rem;\n  padding: .65rem;\n  border: 1px solid var(--border);\n  border-radius: 10px;\n  background: var(--surface-subtle, var(--surface));\n}\n.complaint-severity-editor > label { min-width: 0; }\n.complaint-severity-history { display: grid; gap: .3rem; min-width: 0; }\n.complaint-severity-history > div { display: flex; flex-wrap: wrap; gap: .3rem; }\n.complaint-severity-point { max-width: 100%; }\n.complaint-severity-editor > p { grid-column: 1 / -1; margin: 0; }\n@media (max-width: 760px) {\n  .complaint-severity-editor { grid-template-columns: minmax(0, 1fr); align-items: stretch; }\n}\n`;

await writeFile(file, css, "utf8");
console.log("Applied Feature 47 complaint severity evolution CSS patch.");
