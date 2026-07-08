import fs from "node:fs";

const text = fs.readFileSync("packages/shared/src/permissions.ts", "utf8");

const required = ["export enum Role", "export enum Action", "ROLE_PERMISSIONS", "hasPermission", "hasAnyRolePermission"];
for (const needle of required) {
  if (!text.includes(needle)) throw new Error(`permissions source missing: ${needle}`);
}

const receptionistBlock = text.match(/\[Role\.RECEPTIONIST\]: \[([\s\S]*?)\]/)?.[1] ?? "";
const doctorBlock = text.match(/\[Role\.DOCTOR\]: \[([\s\S]*?)\]/)?.[1] ?? "";
const adminBlock = text.match(/\[Role\.ADMIN\]: \[([\s\S]*?)\]/)?.[1] ?? "";

if (receptionistBlock.includes("VISIT_START") || receptionistBlock.includes("PRESCRIPTION_SIGN")) throw new Error("Receptionist must not receive doctor visit or signing actions.");
if (!receptionistBlock.includes("QUEUE_CHECKIN")) throw new Error("Receptionist queue check-in permission missing.");
if (!doctorBlock.includes("VISIT_START") || !doctorBlock.includes("PRESCRIPTION_SIGN")) throw new Error("Doctor core clinical permissions missing.");
if (doctorBlock.includes("PATIENT_REGISTER")) throw new Error("Doctor must not receive receptionist registration flow.");
if (!adminBlock.includes("ADMIN_OVERRIDE_WITH_REASON") || adminBlock.includes("PRESCRIPTION_SIGN")) throw new Error("Admin boundary mismatch.");

console.log("v1.4.2 permissions RBAC contract passed.");
