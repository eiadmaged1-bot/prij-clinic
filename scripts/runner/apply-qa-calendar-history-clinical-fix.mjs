import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

function replaceOne(relative, oldValue, newValue, label) {
  const target = path.join(root, relative);
  let content = fs.readFileSync(target, "utf8");
  const count = content.split(oldValue).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one target, found ${count}`);
  content = content.replace(oldValue, newValue);
  fs.writeFileSync(target, content, "utf8");
}

replaceOne(
  "apps/web/app/patients/[id]/patient-components.tsx",
  '<button className="text-button compact" type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button>',
  '<button className="text-button compact" type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>Previous</button>',
  "Previous calendar control"
);

replaceOne(
  "apps/web/app/patients/[id]/patient-components.tsx",
  '<button className="text-button compact" type="button" aria-label="Next month" onClick={() => moveMonth(1)}>›</button>',
  '<button className="text-button compact" type="button" aria-label="Next month" onClick={() => moveMonth(1)}>Next</button>',
  "Next calendar control"
);

replaceOne(
  "apps/web/app/globals.css",
  "grid-template-columns: 34px minmax(0, 1fr) auto 34px;",
  "grid-template-columns: auto minmax(0, 1fr) auto auto;",
  "calendar toolbar columns"
);

replaceOne(
  "apps/web/app/globals.css",
  ".context-calendar-toolbar .compact { min-width: 32px; min-height: 32px; padding: 3px 7px; }",
  ".context-calendar-toolbar .compact { min-width: 0; min-height: 30px; padding: 3px 7px; font-size: 10px; }",
  "compact calendar toolbar buttons"
);

console.log("Calendar navigation contract restored with compact Previous/Next controls.");
