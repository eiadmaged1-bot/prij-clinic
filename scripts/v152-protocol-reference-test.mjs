import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { v152ProtocolReferences, v152ProtocolSources } = require("../apps/api/prisma/seeds/v152-protocol-references");
const [schema, page, browser, service] = await Promise.all([readFile("apps/api/prisma/schema.prisma", "utf8"), readFile("apps/web/app/protocol-atlas/[id]/page.tsx", "utf8"), readFile("apps/web/components/protocol-atlas/ProtocolAtlasBrowser.tsx", "utf8"), readFile("apps/api/src/protocol-atlas/protocol-atlas.service.ts", "utf8")]);
assert.ok(v152ProtocolReferences.length >= 40);
assert.equal(new Set(v152ProtocolReferences.map((item) => item.code)).size, v152ProtocolReferences.length);
for (const item of v152ProtocolReferences) { assert.ok(v152ProtocolSources[item.sourceKey]); assert.match(v152ProtocolSources[item.sourceKey].url, /^https:\/\//); assert.ok(item.section); }
assert.match(schema, /model ClinicalProtocolVersion/); assert.match(schema, /publicationState/); assert.match(service, /sourceCitationsJson/);
for (const field of ["Purpose", "Entry criteria", "Red flags", "Assessment steps", "Relevant investigations", "Referral and escalation", "Source citations"]) assert.match(page, new RegExp(field));
assert.match(browser, /SOURCE_VERIFIED_REFERENCE/); assert.match(page, /cannot diagnose, prescribe, order, or change a patient record/);
console.log(`v1.5.2 source-verified protocol reference contracts PASS (${v152ProtocolReferences.length} references)`);
