import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url); const { v152InvestigationSets } = require("../apps/api/prisma/seeds/v152-investigation-sets");
const [schema, service, page] = await Promise.all([readFile("apps/api/prisma/schema.prisma", "utf8"), readFile("apps/api/src/investigations/investigations.service.ts", "utf8"), readFile("apps/web/app/investigations/page.tsx", "utf8")]);
assert.equal(v152InvestigationSets.length, 12); assert.equal(new Set(v152InvestigationSets.map((item) => item.stableCode)).size, 12);
for (const item of v152InvestigationSets) { assert.match(item.sourceUrl, /^https:\/\//); assert.ok(item.sourceIdentifier && item.sourceSection); if (!item.actionable) assert.equal(item.codes.length, 0); }
assert.match(schema, /sourceIdentifier/); assert.match(schema, /required\s+Boolean/); assert.match(service, /editable:/); assert.match(page, /Applying this set fills the basket/); assert.match(page, /Required|Optional/); assert.match(page, /Applying a set never orders automatically/);
assert.match(service, /Review investigation result/); assert.match(service, /Follow up overdue investigation/); assert.match(service, /relatedOrderId/);
console.log("v1.5.2 governed investigation sets and connected basket contracts PASS");
