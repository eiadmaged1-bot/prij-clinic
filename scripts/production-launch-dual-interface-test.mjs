import { readFileSync } from "node:fs";
const schema = file("apps/api/prisma/schema.prisma");
const controller = file("apps/api/src/users/users.controller.ts");
const service = file("apps/api/src/users/users.service.ts");
const client = file("apps/web/lib/interface-mode.ts");
const shell = file("apps/web/app/mvp-page.tsx");
const settings = file("apps/web/components/settings/InterfaceModeSettings.tsx");
for (const value of ["OPTIMIZED", "MINIMALISTIC", "COMPACT", "COMFORTABLE", "LARGE", "AUTO", "BOTTOM_NAV", "DRAWER"]) assert(schema.includes(value), `typed preference ${value}`);
assert(schema.includes("@default(OPTIMIZED)"), "Optimized is the database default");
assert(controller.includes('@Controller("users/me/preferences")') && controller.includes("@Get()") && controller.includes("@Patch()"), "authenticated preference endpoint exists");
assert(controller.includes("BadRequestException") && controller.includes("Unsupported preference field"), "invalid values and fields are rejected");
assert(service.includes("userPreference.upsert"), "existing users receive persistent defaults");
assert(client.includes("credentials: \"include\"") && client.includes("prij:display-preferences"), "server preference is authoritative with display-only cache");
assert(!client.includes("Token") && !client.includes("authorization"), "preference cache stores no authentication data");
assert(shell.includes("data-interface-mode") && !service.includes("permissionPreset") === false, "interface mode is presentation-only");
assert(settings.includes("Optimized") && settings.includes("Minimalistic") && /[\u0600-\u06ff]/.test(settings), "English and Arabic interface labels exist");
console.log("PRODUCTION-LAUNCH-DUAL-INTERFACE PASS");
function file(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function assert(value, message) { if (!value) throw new Error(message); }
