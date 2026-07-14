import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canAccessWorkspace, roleLandingPath, safePostLoginPath } from "../apps/web/lib/role-routing.ts";

const receptionist = { roles: ["Receptionist"], permissions: ["patient.create", "queue.manage"] };
const doctor = { roles: ["Doctor"], permissions: ["encounter.create"] };
const owner = { roles: ["Owner"], permissions: ["clinic_settings.manage"] };

assert.equal(roleLandingPath(receptionist), "/reception");
assert.equal(roleLandingPath(doctor), "/doctor");
assert.equal(roleLandingPath(owner), "/owner-control");
assert.equal(safePostLoginPath(null, receptionist), "/reception");
assert.equal(safePostLoginPath("/dashboard", doctor), "/doctor");
assert.equal(safePostLoginPath("/doctor", receptionist), "/reception");
assert.equal(safePostLoginPath("/reception", doctor), "/doctor");
assert.equal(safePostLoginPath("//outside.example", owner), "/owner-control");
assert.equal(canAccessWorkspace("/doctor", receptionist), false);
assert.equal(canAccessWorkspace("/doctor/waiting", receptionist), false);
assert.equal(canAccessWorkspace("/doctor", doctor), true);
assert.equal(canAccessWorkspace("/doctor", owner), true);
assert.equal(canAccessWorkspace("/reception", receptionist), true);
assert.equal(canAccessWorkspace("/owner-control", doctor), false);

const [shell, login, doctorController] = await Promise.all([
  readFile(new URL("../apps/web/app/mvp-page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/login/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/api/src/doctor-visit/doctor-visit.controller.ts", import.meta.url), "utf8")
]);

assert.match(shell, /status === "loading"/);
assert.match(shell, /role-neutral-loading/);
assert.match(shell, /canAccessWorkspace\(pathname, user\)/);
assert.match(login, /safePostLoginPath\(requestedReturnUrl, user\)/);
assert.match(doctorController, /@UseGuards\(JwtAuthGuard, PermissionsGuard\)/);
assert.match(doctorController, /@Permissions\("encounter\.create"\)/);

console.log("v1.4.5 role routing and workspace authorization: 20 assertions passed");
