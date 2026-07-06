import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V130-CASE-LIBRARY PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const seed = await readFile("apps/api/prisma/seed.js", "utf8");
const service = await readFile("apps/api/src/case-library/case-library.service.ts", "utf8");
const controller = await readFile("apps/api/src/case-library/case-library.controller.ts", "utf8");
const page = await readFile("apps/web/app/doctor/case-library/page.tsx", "utf8");
const nav = await readFile("apps/web/app/navigation-registry.ts", "utf8");

assert(seed.includes("clinical_case_library.view_own") && seed.includes("clinical_case_library.view_all"), "case library permissions missing");
pass("case library permissions exist");
assert(service.includes('requestedScope === "all"') && service.includes("doctorId: user.id"), "own/all scope logic missing");
pass("doctor can browse own and trusted all cases");
assert(service.includes("CLINICAL_CASE_VIEWED"), "colleague case audit event missing");
pass("clinical colleague view audit event exists");
assert(page.includes("My cases") && page.includes("All clinic cases") && page.includes("Visit type") && page.includes("Patient name, phone, MRN"), "case library filters missing");
pass("filters exist for scope date visit type and search");
assert(page.includes("Visit doctor") && page.includes("doctorSignature.doctorColor") && page.includes("Open patient profile") && page.includes("Open visit"), "case card required fields missing");
pass("case cards show doctor name color and open links");
assert(nav.includes("/doctor/case-library") && nav.includes('roles: ["Owner", "Admin", "Doctor"]'), "case library nav restriction missing");
pass("receptionist/accountant are not shown clinical case library nav");
assert(controller.includes('@Permissions("clinical_case_library.view_own")'), "case library route permission missing");
pass("case library API is permission protected");

console.log(`V130-CASE-LIBRARY SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
