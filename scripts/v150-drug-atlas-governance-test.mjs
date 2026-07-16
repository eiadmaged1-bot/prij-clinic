import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [service, workspace, types, seed] = await Promise.all([readFile("apps/api/src/medications/medications.service.ts", "utf8"), readFile("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8"), readFile("apps/web/lib/medications.ts", "utf8"), readFile("apps/api/prisma/seed.js", "utf8")]);

for (const state of ["Verified", "Draft", "Source incomplete", "Conflicting sources", "Needs pharmacology review", "Needs doctor review", "Not applicable"]) assert.match(service, new RegExp(state));
assert.match(service, /sectionStatuses: pharmacologySectionStatuses/);
assert.match(service, /unlinkedRate/); assert.match(service, /populatedRooms/);
assert.match(workspace, /selected\.sectionStatuses/);
assert.match(workspace, /atlas\.rooms\.filter\(\(item\) => item\.genericCount > 0\)/);
assert.match(workspace, /unlinkedRate/);
assert.match(types, /sectionStatuses\?: Record<string, string>/);
assert.match(seed, /ATC\/DDD Index 2026/); assert.match(seed, /WHO Collaborating Centre for Drug Statistics Methodology/);
assert.doesNotMatch(seed, /mainUse:/); assert.doesNotMatch(seed, /mechanism:/);
assert.match(workspace, /does not diagnose, select treatment, prescribe, or dose/);

console.log("v1.5.0 Drug Atlas coverage truthfulness and section governance regressions PASS");
