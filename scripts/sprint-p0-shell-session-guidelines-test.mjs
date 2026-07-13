import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [shell, css, session, login, patient, guidelines] = await Promise.all([
  readFile("apps/web/app/mvp-page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8"),
  readFile("apps/web/app/session.tsx", "utf8"),
  readFile("apps/web/app/login/page.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/page.tsx", "utf8"),
  readFile("apps/web/app/guidelines/GuidelineCenter.tsx", "utf8")
]);

assert(!shell.includes('${isReceptionistOnly ? "no-sidebar receptionist-shell"'), "reception must keep the desktop workspace sidebar");
assert(shell.includes("user.branchName") && shell.includes("<LanguageSwitcher />"), "compact account menu must include branch and language");
assert(!shell.includes('className="topbar-logout-button"') && !shell.includes('className="sidebar-logout-button"'), "logout must not be duplicated outside the account menu");
assert(css.includes("--density-sidebar-width: 16rem") && css.includes("@media (max-width: 1199px)"), "desktop sidebar and mobile breakpoint must be explicit");
assert(css.includes("transform: translateX(calc(-100% - 2rem))") && css.includes(".sidebar.open"), "mobile drawer must start hidden and have an open state");

assert(session.includes("expire(returnUrl?: string)") && session.includes("prijClinicReturnUrl"), "session expiry must preserve a local return URL");
assert(patient.includes("setPatient(null)") && patient.includes("expire(pathname)"), "patient PHI state must clear on an expired session");
assert(!patient.includes("Go to login"), "patient file must not show an embedded login bar");
assert(!login.includes("ownerPassword") && !login.includes('const ownerLoginId ='), "login source must not contain hard-coded credentials");

assert(guidelines.includes("key={card.id}"), "guideline cards must use stable IDs as React keys");
const ids = [...guidelines.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, "guideline card IDs must be unique");

console.log("Sprint P0 shell, session, and guideline contract PASS");
