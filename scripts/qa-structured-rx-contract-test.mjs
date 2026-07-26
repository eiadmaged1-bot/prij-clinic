import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [visit, css] = await Promise.all([
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const token of [
  'type PrescriptionFrequencyCode = "q24h" | "q12h" | "q8h"',
  'labelAr: "مرة يومياً"',
  'labelAr: "مرتين يومياً (صباحاً ومساءً)"',
  'labelAr: "ثلاث مرات يومياً"',
  'Quantity per intake',
  'Duration value',
  'Duration unit',
  'Optional note (the only free-text prescription field)',
  '2 tablets together · q24h',
  'items: lines.map(normalisePrescriptionLineForApi)'
]) assert.match(visit, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.doesNotMatch(visit, /Dose text<input/);
assert.doesNotMatch(visit, /Timing<input/);
assert.doesNotMatch(visit, /Duration<input/);
assert.doesNotMatch(visit, /Instructions<input/);
assert.match(visit, /type="number" min=\{1\} max=\{12\}/);
assert.match(visit, /PRESCRIPTION_DURATION_MAX/);
assert.match(css, /QA-RX-001 QA-RX-002 structured prescription controls/);
assert.match(css, /\.rx-control-grid/);

console.log("Structured prescription controls contract PASS");
