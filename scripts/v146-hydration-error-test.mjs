import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [layout, visit, tags, basket, autosave] = await Promise.all([
  readFile("apps/web/app/layout.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/visit-flow-components.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/patient-components.tsx", "utf8"),
  readFile("apps/web/components/clinical/SelectedBasket.tsx", "utf8"),
  readFile("apps/web/lib/autosave-draft.ts", "utf8")
]);

assert.doesNotMatch(layout, /suppressHydrationWarning/, "hydration warnings must never be globally suppressed");
assert.match(visit, /const visitSteps = \[[^\n]+\] as const/, "visit step identity must remain stable across renders");
assert.match(tags, /const loadTags = useCallback/, "clinical-tag loading must have stable hook dependencies");
assert.match(tags, /\}, \[loadTags\]\)/, "clinical-tag effect must declare its callback dependency");
assert.match(basket, /Every selected item was preserved for retry/, "safe errors must preserve the basket");
assert.match(basket, /role=\{status\.includes\("failed"\) \? "alert" : "status"\}/, "safe inline errors need an accessible role");
assert.doesNotMatch(basket, /error\.stack|console\.error/, "clinic-mode error UI must not expose source stacks");
for (const state of ["Saving", "Saved locally", "Offline", "Retry"]) assert.ok(autosave.includes(state), `autosave state missing: ${state}`);
assert.doesNotMatch(visit, /useState\([^\n]*(Date\.now|Math\.random)/, "visit render must be deterministic");

console.log("v1.4.6 hydration and safe error contract PASS (12 assertions)");
