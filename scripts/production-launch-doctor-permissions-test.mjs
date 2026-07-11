import { readFileSync } from "node:fs";

const seed = readFileSync(new URL("../apps/api/prisma/seed.js", import.meta.url), "utf8");
const doctor = roleBlock("Doctor", "Nurse");
const nurse = roleBlock("Nurse", "Receptionist");
const receptionist = roleBlock("Receptionist", "Accountant");
const required = ["patient.read", "patient.create", "patients.read", "search.global", "encounter.create"];
const forbidden = ["patient.delete", "patient.merge", "billing.adjust", "billing.void", "user.manage", "role.manage", "branch.manage", "audit.export", "system_owner.manage", "developer_owner.manage"];

for (const permission of required) assert(doctor.includes(`"${permission}"`), `Doctor includes ${permission}`);
for (const permission of forbidden) assert(!doctor.includes(`"${permission}"`), `Doctor excludes ${permission}`);
assert(!nurse.includes('"patient.create"'), "Nurse does not gain patient.create");
for (const permission of ["patient.create", "patient.update", "appointment.manage", "queue.manage"]) assert(receptionist.includes(`"${permission}"`), `Receptionist retains ${permission}`);
console.log("PRODUCTION-LAUNCH-DOCTOR-PERMISSIONS PASS");

function roleBlock(role, nextRole) {
  const start = seed.indexOf(`  ${role}: [`);
  const end = seed.indexOf(`  ${nextRole}: [`, start);
  assert(start >= 0 && end > start, `${role} role block exists`);
  return seed.slice(start, end);
}
function assert(condition, message) { if (!condition) throw new Error(message); }
