import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const css = read("apps/web/app/globals.css");
const shell = read("apps/web/app/mvp-page.tsx");
const newPatient = read("apps/web/app/patients/new/page.tsx");
const accounts = read("apps/web/app/admin/accounts/page.tsx");
const admin = read("apps/web/app/admin/page.tsx");
const picker = read("apps/web/components/clinic/PatientPicker.tsx");
const prescriptions = read("apps/web/app/prescriptions/page.tsx");
const investigations = read("apps/web/app/investigations/page.tsx");
const checkIn = read("apps/web/app/reception/check-in/page.tsx");
const guidelines = read("apps/web/app/guidelines/GuidelineCenter.tsx");
const protocolAtlas = read("apps/web/components/protocol-atlas/ProtocolAtlasBrowser.tsx");
const protocolBadge = read("apps/web/components/protocol-atlas/ProtocolStatusBadge.tsx");

assert(css.includes(".doctor-comfort-mode .topbar") && css.includes("white-space: nowrap"), "topbar comfort mode has compact nowrap CSS");
assert(shell.includes("app-menu-button") && shell.includes("doctor-comfort-toggle"), "topbar menu and comfort controls remain wired");
assert(!newPatient.includes("Patient type") && !newPatient.includes("<option value=\"OB\"") && !newPatient.includes("<option value=\"GYN\""), "new patient UI does not show patient type choices");
assert(!newPatient.includes(">Sex<") && !newPatient.includes("Sex field"), "new patient UI does not show a sex field");
assert(accounts.includes("Email optional") && accounts.includes("noValidate") && !accounts.includes("type=\"email\" inputMode=\"email\""), "account email is optional without native required email validation");
assert(accounts.includes("Show demo/test accounts") && accounts.includes("Demo/test accounts hidden"), "accounts demo/test hidden toggle exists");
assert(accounts.includes("loginId.startsWith(\"acctdoctor\")") && accounts.includes("email.includes(\"@accounts.prij.local\") && (loginId.startsWith(\"acct\")"), "demo/test account detection does not hide every blank-email manual account");
assert(admin.includes("Show read events") && admin.includes("Read/view events hidden"), "audit read events hidden toggle exists");
assert(picker.includes("data-patient-picker") && picker.includes("role=\"listbox\""), "PatientPicker component exists with compact listbox");
assert(prescriptions.includes("<PatientPicker") && !prescriptions.includes("<select value={patientId}"), "prescriptions use PatientPicker instead of native patient select");
assert(investigations.includes("<PatientPicker") && !investigations.includes("<select value={patientId}"), "investigations use PatientPicker instead of native patient select");
assert(checkIn.includes("<PatientPicker") && !checkIn.includes("patientMatches.map"), "check-in uses PatientPicker instead of native or duplicated patient picker logic");
assert(investigations.includes("data-selected-request-chips") && investigations.includes("request-chip"), "clinical request selected item chips exist");
assert(guidelines.includes("Show training documents") && guidelines.includes("Training documents hidden") && guidelines.includes("route guideline"), "guideline training document toggle exists");
assert(protocolAtlas.includes("useState<\"cards\" | \"list\">(\"list\")"), "Protocol Atlas defaults to compact list");
assert(protocolBadge.includes("Verified snapshot") && css.includes(".protocol-status") && css.includes("word-break: keep-all"), "Verified snapshot badge is protected from broken words");

console.log(`v0.14.3.1 post visual hotfix checks passed (${checks.length})`);
