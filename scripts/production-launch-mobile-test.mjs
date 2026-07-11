import { readFileSync } from "node:fs";
const nav = file("apps/web/components/layout/MobileBottomNav.tsx");
const css = file("apps/web/app/globals.css");
const footer = file("apps/web/components/doctor/DoctorMobileVisitFooter.tsx");
const header = file("apps/web/components/doctor/DoctorMobilePatientHeader.tsx");
const patient = file("apps/web/app/patients/[id]/page.tsx");
const doctorBlock = nav.slice(nav.indexOf("doctorMinimalisticNav"), nav.indexOf("receptionistMinimalisticNav"));
for (const label of ["Today", "Search", "New Patient", "Current Visit", "Account"]) assert(doctorBlock.includes(`label: \"${label}\"`), `doctor primary item ${label}`);
assert((doctorBlock.match(/label: /g) ?? []).length === 5, "doctor minimalistic navigation has exactly five items");
assert(!doctorBlock.includes("Admin") && !doctorBlock.includes("Owner"), "doctor primary navigation omits owner/admin modules");
assert(nav.includes("receptionistMinimalisticNav") && !nav.slice(nav.indexOf("receptionistMinimalisticNav")).includes('label: "Current Visit"'), "receptionist has no doctor clinical action");
assert(nav.includes("doctor-quick-create"), "doctor fallback patient creation remains first class");
assert(css.includes("min-height: 48px") && css.includes("env(safe-area-inset-bottom)") && css.includes("overflow-x: clip"), "touch, safe-area, and 360px overflow protections exist");
for (const action of ["Save Draft", "Rx", "Requests", "Finish"]) assert(footer.includes(action), `visit footer ${action}`);
for (const status of ["Saving", "Saved", "Offline draft", "Sync failed"]) assert(footer.includes(status), `save status ${status}`);
assert(header.includes("sticky") || css.includes("doctor-mobile-patient-header { position: sticky"), "patient identity is sticky");
assert(patient.includes("window.confirm") && !patient.includes("window.location.reload"), "finish is confirmed and workflows avoid page reload");
assert(/[\u0600-\u06ff]/.test(nav), "Arabic navigation labels exist");
console.log("PRODUCTION-LAUNCH-MOBILE PASS");
function file(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function assert(value, message) { if (!value) throw new Error(message); }
