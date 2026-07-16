import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [search, directory, cases, casePage, schema, routeAudit] = await Promise.all([
  read("apps/api/src/patients/services/patient-search.service.ts"),
  read("apps/web/app/patients/page.tsx"),
  read("apps/api/src/case-library/case-library.service.ts"),
  read("apps/web/app/doctor/case-library/page.tsx"),
  read("apps/api/prisma/schema.prisma"),
  read("docs/V151_LIVE_ROUTE_AUDIT.md")
]);

assert.match(search, /status: requestedStatus/);
assert.match(search, /notIn: \["TEST", "QUARANTINED"\]/);
assert.match(search, /directoryView === "waiting"/);
assert.match(search, /directoryView === "favorites"/);
assert.match(directory, /All clinic patients/);
assert.match(directory, /showing/);
assert.doesNotMatch(directory, /Include archived|Restore patient/);
assert.match(schema, /model PatientFavorite/);
assert.match(cases, /requestedScope === "all" \? \{\} :/);
assert.match(cases, /doctorId: user\.id/);
assert.match(cases, /startedByUserId: user\.id/);
assert.match(cases, /signedByUserId: user\.id/);
assert.match(cases, /skip: \(page - 1\) \* limit/);
assert.match(cases, /caseCount: total/);
assert.match(casePage, /All clinic cases/);
assert.match(casePage, /Reset filters/);
assert.match(casePage, /Showing/);
assert.match(routeAudit, /\/admin\/services.*Legacy\/incorrect/);

console.log("v1.5.1 patient operations and live-route contracts passed");
