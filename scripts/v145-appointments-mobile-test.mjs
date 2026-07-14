import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [calendar, appointments, css] = await Promise.all([
  readFile(new URL("../apps/web/app/calendar/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/appointments/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
]);

assert.match(appointments, /calendar\/page/);
for (const value of ["Appointments & Queue", "Doctor Schedule & Waiting List", "Appointments", "EDD", "day", "week", "month", "Doctor", "Branch", "Status"]) assert.ok(calendar.includes(value));
assert.match(calendar, /<details className="filter-drawer calendar-filter-drawer">/);
assert.doesNotMatch(calendar, /<details className="filter-drawer calendar-filter-drawer" open/);
const scheduleIndex = calendar.indexOf('className="content-grid calendar-clean-grid"');
const summaryIndex = calendar.indexOf('className="panel compact-panel today-summary-card"');
assert.ok(scheduleIndex >= 0 && summaryIndex > scheduleIndex, "summary must follow schedule and queue");
assert.match(calendar, /isReceptionistOnly \? copy\.openReceptionProfile : copy\.openPatientFile/);
assert.match(calendar, /isDoctorOnly \? copy\.doctorTitle : copy\.title/);
assert.match(css, /calendar-filter-drawer/);
assert.match(css, /compact-summary-list[\s\S]*grid-template-columns: repeat\(2/);

console.log("v1.4.5 compact appointments and queue workflow: 18 assertions passed");
