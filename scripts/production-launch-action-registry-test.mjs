import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { Project, SyntaxKind } from "ts-morph";

if (process.argv.length !== 2 || !process.env.DATABASE_URL || !process.env.TEST_API_PORT) {
  console.error("DATABASE_URL and TEST_API_PORT are required; flags are not accepted."); process.exit(2);
}
const databaseUrl = new URL(process.env.DATABASE_URL); const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
if (!databaseName.includes("_test_part_h_")) { console.error("Refusing non-Part-H database."); process.exit(2); }
console.log(`database name: ${databaseName}`); console.log("host classification: isolated test host"); console.log(`schema: ${databaseUrl.searchParams.get("schema") || "public"}`); console.log("disposable: yes");

const root = process.cwd(); const project = new Project({ tsConfigFilePath: path.join(root, "packages/shared/tsconfig.json") });
const source = project.getSourceFileOrThrow(path.join(root, "packages/shared/src/app-actions.ts"));
const array = source.getVariableDeclarationOrThrow("coreAppActions").getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
const actions = array.getElements().map((element) => {
  const object = element.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const text = (name) => object.getPropertyOrThrow(name).asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerOrThrow().getText().replace(/^['"]|['"]$/g, "");
  const permissionProperty = object.getProperty("permission")?.asKindOrThrow(SyntaxKind.PropertyAssignment);
  const requiredProperty = object.getProperty("requiredPermissions")?.asKindOrThrow(SyntaxKind.PropertyAssignment);
  const permission = permissionProperty?.getInitializerOrThrow().getText().replace(/^['"]|['"]$/g, "");
  const requiredPermissions = requiredProperty?.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression).getElements().map((item) => item.getText().replace(/^['"]|['"]$/g, "")) ?? (permission && permission !== "null" ? [permission] : []);
  return { id: text("id"), labelAr: text("labelAr"), labelEn: text("labelEn"), auditRequirement: text("auditRequirement"), permission: permission === "null" ? null : permission, requiredPermissions };
});
assert.equal(new Set(actions.map((action) => action.id)).size, actions.length, "duplicate action IDs");
assert.ok(actions.every((action) => action.labelEn && /[\u0600-\u06ff]/u.test(action.labelAr)), "missing bilingual action label");
assert.ok(!actions.some((action) => action.id === "encounter.delete"), "hard-delete encounter action must not exist");
const voidAction = actions.find((action) => action.id === "encounter.void"); assert.equal(voidAction?.permission, "encounter.void"); assert.equal(voidAction?.auditRequirement, "security_audit");
for (const sensitive of actions.filter((action) => /(?:create|void|override|start)/i.test(action.id))) assert.notEqual(sensitive.auditRequirement, "none", `${sensitive.id} requires audit policy`);
const seedFile = project.addSourceFileAtPath(path.join(root, "apps/api/prisma/seed.js"));
const declaredPermissions = new Set(seedFile.getVariableDeclarations().filter((declaration) => /permissions$/i.test(declaration.getName())).flatMap((declaration) => declaration.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)?.getElements().map((item) => item.getText().replace(/^["']|["']$/g, "")) ?? []));
for (const action of actions) for (const permission of action.requiredPermissions) assert.ok(declaredPermissions.has(permission), `unknown permission ${permission} on ${action.id}`);

const webFiles = project.addSourceFilesAtPaths(path.join(root, "apps/web/**/*.{ts,tsx}"));
const registryIds = new Set(actions.map((action) => action.id));
for (const file of webFiles) for (const match of file.getFullText().matchAll(/actionId=[{]?['"]([^'"]+)['"]/g)) assert.ok(registryIds.has(match[1]), `orphan frontend action ${match[1]}`);

const prisma = new PrismaClient(); const port = Number(process.env.TEST_API_PORT);
function request(method, requestPath, cookie, body = {}) { const payload=JSON.stringify(body); const csrf=/(?:^|;\s*)csrf-token=([^;]+)/.exec(cookie)?.[1]; return new Promise((resolve,reject)=>{const req=http.request({hostname:"127.0.0.1",port,path:requestPath,method,headers:{Cookie:cookie,"x-csrf-token":csrf,"content-type":"application/json","content-length":Buffer.byteLength(payload)}},res=>{let data="";res.on("data",chunk=>data+=chunk);res.on("end",()=>resolve({status:res.statusCode,data}));});req.on("error",reject);req.write(payload);req.end();}); }
async function session(userId) { const raw=crypto.randomBytes(32).toString("base64url"), csrf=crypto.randomBytes(24).toString("base64url"); await prisma.authSession.create({data:{userId,sessionTokenHash:crypto.createHash("sha256").update(raw).digest("hex"),expiresAt:new Date(Date.now()+3600000)}}); return `prij_clinic_session=${raw}; csrf-token=${csrf}`; }
async function userFor(roleName, suffix, denyPermission) { const branch=await prisma.branch.findFirstOrThrow({orderBy:{createdAt:"asc"}}); const role=await prisma.role.findUniqueOrThrow({where:{name:roleName}}); const user=await prisma.user.create({data:{email:`part-h-action-${suffix}@invalid.local`,loginId:`part-h-action-${suffix}`,displayName:`Part H ${roleName}`,status:"active",branchId:branch.id,passwordHash:null,userRoles:{create:{roleId:role.id,branchId:branch.id}}}}); if(denyPermission){const permission=await prisma.permission.findUniqueOrThrow({where:{key:denyPermission}});await prisma.userPermissionOverride.create({data:{userId:user.id,permissionId:permission.id,effect:"deny"}});} return {user,cookie:await session(user.id)}; }

async function prepareAuthorizationFixture() {
  await prisma.branch.create({data:{name:"Part H Action Branch",code:`PHA-${Date.now()}`}});
  for (const name of ["Receptionist", "Doctor", "Owner"]) await prisma.role.upsert({where:{name},create:{name,description:`Part H ${name} role`},update:{}});
  for (const key of ["encounter.create", "encounter.void", "clinical_requests.write"]) await prisma.permission.upsert({where:{key},create:{key,description:`Part H ${key}`},update:{}});
  for (const [roleName, keys] of [["Doctor",["encounter.create"]],["Owner",["encounter.create","encounter.void","clinical_requests.write"]]]) {
    const role=await prisma.role.findUniqueOrThrow({where:{name:roleName}});
    for (const key of keys) { const permission=await prisma.permission.findUniqueOrThrow({where:{key}}); await prisma.rolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:permission.id}},create:{roleId:role.id,permissionId:permission.id},update:{}}); }
  }
}

try {
  await prepareAuthorizationFixture();
  const suffix=Date.now(); const receptionist=await userFor("Receptionist",`${suffix}-r`); const doctorDenied=await userFor("Doctor",`${suffix}-d`,"encounter.create"); const ownerDenied=await userFor("Owner",`${suffix}-o-deny`,"encounter.void"); const ownerAllowed=await userFor("Owner",`${suffix}-o-allow`);
  assert.equal((await request("POST","/encounters",receptionist.cookie,{})).status,403,"receptionist direct clinical request must be denied");
  assert.equal((await request("POST","/clinical-requests",receptionist.cookie,{})).status,403,"receptionist clinical request creation must be denied");
  assert.equal((await request("POST","/encounters",doctorDenied.cookie,{})).status,403,"Doctor role must not bypass a denied permission");
  const encounterId=crypto.randomUUID(); assert.equal((await request("PATCH",`/encounters/${encounterId}/void`,ownerDenied.cookie,{reason:"Part H authorization test"})).status,403,"Owner role must not bypass a denied permission");
  assert.notEqual((await request("PATCH",`/encounters/${encounterId}/void`,ownerAllowed.cookie,{reason:"Part H authorization test"})).status,403,"authorized Owner permission should reach domain handling");
  console.log("Action IDs, permissions, labels, audit policy, receptionist denial, Doctor denial, and Owner backend enforcement passed.");
} finally { await prisma.$disconnect(); }
