import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const login = read("apps/web/app/login/page.tsx");
const newPatient = read("apps/web/app/patients/new/page.tsx");
const seed = read("apps/api/prisma/seed.js");
const css = read("apps/web/app/globals.css");

assert(login.includes("premium-login-card") && login.includes("Prij Clinic") && login.includes("Welcome back"), "login has minimal premium structure");
assert(login.includes("Staff ID or email") && login.includes("Password") && login.includes("Sign in"), "login keeps required fields and action");
assert(login.includes("LanguageSwitcher") && login.includes("subtle-login-details"), "login has compact language switcher and collapsed helper");
for (const phrase of ["Use demo data only", "Local Demo", "not a production clinic login", "no real patient data"]) {
  assert(!login.includes(phrase), `login normal UI removes clutter phrase: ${phrase}`);
}

assert(newPatient.includes("fullName") && !newPatient.includes("First name") && !newPatient.includes("Last name"), "new patient form uses full name only");
assert(newPatient.includes("Year of birth") && newPatient.includes("ageFromYear") && !newPatient.includes("Date of birth"), "new patient form uses year of birth and calculated age");
assert(!newPatient.includes("Source / referral") && !newPatient.includes("referralSource"), "source/referral removed from patient creation");
assert(newPatient.includes("Not sexually active") && newPatient.includes("sensitive-bottom-checkbox"), "not sexually active checkbox remains at bottom");
assert(css.includes("premium-depth-card") && css.includes("premium-login-button"), "light premium 3D button/card classes exist");

assert(seed.includes("process.env.SEED_DEMO_DATA === \"true\"") && seed.includes("ALLOW_DEMO_DATA_SEED"), "normal seed does not enable demo data by default");
for (const account of ["demo.doctor@prij.local", "demo.reception@prij.local", "demo.accountant@prij.local"]) {
  assert(seed.includes(account) && seed.includes("deleteMany"), `seed actively removes prior demo account marker: ${account}`);
}
assert(!seed.includes("Demo Doctor User") && !seed.includes("Demo Reception User") && !seed.includes("Demo Accountant User"), "seed no longer creates persistent demo staff accounts");

console.log(`v1.2.1 premium clean UI checks passed (${checks.length})`);
