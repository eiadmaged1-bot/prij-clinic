import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["apps/web/app", "apps/web/components", "apps/web/lib"];

const blocked = [
  { pattern: /\bPrisma\b/i, label: "Prisma" },
  { pattern: /\bJWT\b/i, label: "JWT" },
  { pattern: /\bRBAC\b/i, label: "RBAC" },
  { pattern: /stack trace/i, label: "stack trace" },
  { pattern: /schema\.prisma/i, label: "schema.prisma" },
  { pattern: /database model/i, label: "database model" },
  { pattern: /mock response/i, label: "mock response" },
  { pattern: /route handler/i, label: "route handler" },
  { pattern: /TypeScript error/i, label: "TypeScript error" },
  { pattern: /Unhandled Runtime Error/i, label: "Unhandled Runtime Error" },
  { pattern: /console-only/i, label: "console-only wording" },
  { pattern: /source debug/i, label: "source debug" },
  { pattern: /raw source payload/i, label: "raw source payload" },
  { pattern: /raw import row payload/i, label: "raw import row payload" },
  { pattern: /raw JSON/i, label: "raw JSON" },
  { pattern: /\/api\//i, label: "/api/ visible path" },
  { pattern: /localhost/i, label: "localhost" }
];

const allowedText = [
  /Local Demo/i,
  /not production-ready/i,
  /\bRole\b/,
  /\bPermission\b/,
  /Source-tracked/i,
  /Verified/i,
  /Needs review/i,
  /Bahrain data/i,
  /Oman data/i
];

const adminSecurityPaths = [
  "apps/web/app/admin",
  "apps/web/app/owner-control",
  "apps/web/app/navigation-registry.ts"
];

const internalResolverPaths = [
  "apps/web/lib/api-base-url.ts"
];

const internalLinePatterns = [
  /NEXT_PUBLIC_API_URL/,
  /localApiBaseUrl/,
  /hostname ===/,
  /const apiUrl =/,
  /\bfetch\(/,
  /\bendpoint:/,
  /\bcreateEndpoint:/,
  /\bhref:/,
  /\bpermissions:/,
  /import .* from /,
  /from ["']/,
  /eslint-disable/,
  /^\s*\/\//,
  /^\s*\*/,
  /\braw\b/i
];

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next"].includes(entry.name)) continue;
      files.push(...await listFiles(path));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

function normalizePath(path) {
  return relative(process.cwd(), path).replace(/\\/g, "/");
}

function isAllowed(path, line, label) {
  if (allowedText.some((pattern) => pattern.test(line))) return true;
  if (internalResolverPaths.includes(path)) return true;
  if ((label === "Role" || label === "Permission") && adminSecurityPaths.some((prefix) => path.startsWith(prefix))) return true;
  if (label === "RBAC" && path.startsWith("apps/web/app/admin")) return true;
  if (["/api/ visible path", "localhost"].includes(label) && internalLinePatterns.some((pattern) => pattern.test(line))) return true;
  if (internalLinePatterns.some((pattern) => pattern.test(line)) && !/["'`][^"'`]*(Prisma|JWT|RBAC|Unhandled Runtime Error|raw JSON|stack trace)[^"'`]*["'`]/i.test(line)) return true;
  return false;
}

async function main() {
  const files = (await Promise.all(roots.map(listFiles))).flat();
  const failures = [];

  for (const file of files) {
    const path = normalizePath(file);
    const source = await readFile(file, "utf8");
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const item of blocked) {
        if (!item.pattern.test(line)) continue;
        if (isAllowed(path, line, item.label)) continue;
        failures.push(`${path}:${index + 1} visible/code-like text "${item.label}" -> ${line.trim().slice(0, 180)}`);
      }
    });
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`V093-UI-TEXT FAIL ${failure}`);
    console.error(`V093-UI-TEXT SUMMARY PASS 0 WARN 0 FAIL ${failures.length}`);
    process.exitCode = 1;
    return;
  }

  console.log(`V093-UI-TEXT PASS scanned ${files.length} frontend files`);
  console.log("V093-UI-TEXT SUMMARY PASS 1 WARN 0 FAIL 0");
}

await main().catch((error) => {
  console.error(`V093-UI-TEXT FAIL setup - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
