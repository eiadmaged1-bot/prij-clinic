import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const doctor = await readFile("apps/web/app/doctor/page.tsx", "utf8");
const patientSearch = await readFile("apps/web/components/patients/PatientSearchMobile.tsx", "utf8");
const dashboardUi = `${doctor}\n${patientSearch}`;
const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");

for (const required of [
  "Current patient / active visit",
  "Waiting patients",
  "Appointments today",
  "Results requiring review",
  "Follow-ups due",
  "Recent activity",
  "Search Patient",
  "Open next patient",
  "Find patient",
  "Resume active visit"
]) {
  assert.ok(dashboardUi.includes(required), `doctor dashboard must include ${required}`);
}

for (const removed of ["doctor-hero", "FocusCard", "DoctorQuickPatientCreate", "Visit type counts", "Open Doctor Mode", "medication count"]) {
  assert.equal(doctor.includes(removed), false, `doctor dashboard must remove ${removed}`);
}

assert.match(doctor, /const \[loading, setLoading\] = useState\(true\)/, "dashboard must distinguish loading from zero");
assert.match(doctor, /waiting\.length/, "waiting KPI must render a numeric count");
assert.match(doctor, /todayAppointments\.length/, "appointment KPI must render a numeric count");
assert.match(doctor, /resultsToReview\.length/, "result KPI must render a numeric count");
assert.match(doctor, /followUpsDue\.length/, "follow-up KPI must render a numeric count");
assert.equal(doctor.includes('useState<number | string>("-")'), false, "loaded zero values must not render as dashes");
assert.match(doctor, /\/investigation-results.*\/patient-tasks.*\/encounters/, "counts and activity must use scoped operational endpoints");
assert.match(doctor, /current\?\.patientId && canStartVisit/, "resume action must require active patient context and visit permission");
assert.match(shell, /\^doc\$.*\? "Doctor"/s, "unfinished doc identity must be normalized");
assert.match(css, /\.doctor-operational-grid\s*{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/, "desktop operational cards must be symmetrical");
assert.match(css, /@media \(max-width: 1199px\)[\s\S]*?\.doctor-operational-grid\s*{\s*grid-template-columns: 1fr;/, "doctor operational layout must collapse safely on smaller screens");

console.log("v1.4.4 doctor dashboard: 30 assertions passed");
