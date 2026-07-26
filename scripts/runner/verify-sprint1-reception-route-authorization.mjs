import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const queueController = read("apps/api/src/queue/queue.controller.ts");
const patientsController = read("apps/api/src/patients/patients.controller.ts");
const encountersController = read("apps/api/src/encounters/encounters.controller.ts");
const permissionsGuard = read("apps/api/src/rbac/permissions.guard.ts");
const queueService = read("apps/api/src/queue/queue.service.ts");
const shell = read("apps/web/app/mvp-page.tsx");

const queueContracts = [
  '@Controller("queue")',
  "@UseGuards(JwtAuthGuard, PermissionsGuard)",
  '@Permissions("queue.manage")',
  '@Permissions("queue.read")',
  '@Permissions("queue.status_update")',
  '@Permissions("doctor_queue.select_patient")',
  '@Patch(":id/select")',
  "return this.queue.selectForDoctor(id, user)"
];
for (const needle of queueContracts) {
  if (!queueController.includes(needle)) throw new Error("Queue authorization contract missing: " + needle);
}

for (const [source, label] of [[patientsController, "patients"], [encountersController, "encounters"]]) {
  if (!source.includes("@UseGuards(JwtAuthGuard, PermissionsGuard)")) throw new Error(label + " controller must use JWT and permission guards.");
  if (!source.includes("@Permissions(")) throw new Error(label + " controller must declare route permissions.");
}

for (const needle of ["Reflector", "requiredPermissions", "user.permissions", "ForbiddenException"]) {
  if (!permissionsGuard.includes(needle)) throw new Error("Permission guard contract missing: " + needle);
}

for (const needle of ["branchScope(user)", "DOCTOR_ROOM_OCCUPIED", "QUEUE_SELECTION_CONFLICT", "singleCalledPatient: true"]) {
  if (!queueService.includes(needle)) throw new Error("Queue service scope contract missing: " + needle);
}

for (const needle of ["isReceptionistOnly", "receptionist-shell no-sidebar", "!isReceptionistOnly ? <UniversalSearchBox /> : null"]) {
  if (!shell.includes(needle)) throw new Error("Reception route visibility boundary missing: " + needle);
}
if (shell.includes('isReceptionistOnly ? receptionistMinimalisticNav')) throw new Error("Receptionist-only accounts must not receive clinical bottom navigation.");

console.log("Sprint 1 reception route authorization boundaries PASS");
