import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Project, SyntaxKind } from "ts-morph";

if (process.argv.length !== 2) {
  console.error("This test accepts no flags.");
  process.exit(2);
}

const root = process.cwd();
const registryPath = path.join(root, "apps/web/components/patients/patient-workspace-registry.ts");
const pagePath = path.join(root, "apps/web/app/patients/[id]/page.tsx");
const rendererPath = path.join(root, "apps/web/app/patients/[id]/workspace-module-renderer.tsx");
const project = new Project({ tsConfigFilePath: path.join(root, "apps/web/tsconfig.json") });
const registryFile = project.getSourceFileOrThrow(registryPath);
const registryArray = registryFile.getVariableDeclarationOrThrow("patientWorkspaceRegistry").getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
const calls = registryArray.getElements().map((element) => element.asKindOrThrow(SyntaxKind.CallExpression));
const entries = calls.map((call) => {
  const args = call.getArguments();
  return {
    key: args[0].getText().slice(1, -1),
    label: args[1].getText().slice(1, -1),
    labelAr: args[2].getText().slice(1, -1),
    optimized: args[7].getText() === "true",
    minimalistic: args[8].getText() === "true",
    roles: args[10]?.getText() ?? ""
  };
});

assert.equal(new Set(entries.map((entry) => entry.key)).size, entries.length, "workspace module IDs must be unique");
assert.ok(entries.every((entry) => entry.label && entry.labelAr && /[\u0600-\u06ff]/u.test(entry.labelAr)), "every module requires English and Arabic labels");
assert.deepEqual(entries.filter((entry) => entry.minimalistic).map((entry) => entry.key), ["overview", "doctor-visit", "prescriptions", "investigations", "more"], "Minimalistic keys changed");
for (const clinicalKey of ["doctor-visit", "prescriptions", "investigations", "pregnancy", "infertility", "ultrasound"]) {
  const entry = entries.find((item) => item.key === clinicalKey);
  assert.ok(entry, `missing ${clinicalKey}`);
  assert.match(entry.roles, /Doctor/, `${clinicalKey} must be role-restricted`);
  assert.doesNotMatch(entry.roles, /Reception/, `${clinicalKey} must not be exposed to receptionists`);
}

const pageSource = fs.readFileSync(pagePath, "utf8");
assert.match(pageSource, /searchParams\.get\("module"\)/, "deep module links must remain supported");
assert.match(pageSource, /searchParams\.get\("tab"\)/, "legacy tab deep links must remain supported");
assert.match(pageSource, /router\.push\(`\?\$\{nextParams\.toString\(\)\}`/, "module switches must update browser history");
assert.match(pageSource, /visiblePatientWorkspaceItems/, "navigation must use the authoritative registry");
assert.match(pageSource, /!roleContextReady \|\| !visibleTabs\.some/, "module data must wait for role-safe visibility");
const rendererSource = fs.readFileSync(rendererPath, "utf8");
for (const moduleName of ["timeline-components", "visit-flow-components", "panel-components", "pregnancy-components"]) {
  assert.match(rendererSource, new RegExp(`dynamic|lazy`));
  assert.match(rendererSource, new RegExp(moduleName), `${moduleName} must resolve through a lazy boundary`);
}

const routeDir = path.join(root, "apps/web/app/patients/[id]");
const routeFiles = project.getSourceFiles().filter((file) => file.getFilePath().startsWith(routeDir));
const runtimeEdges = new Map(routeFiles.map((file) => [file.getFilePath(), []]));
for (const file of routeFiles) {
  for (const declaration of file.getImportDeclarations()) {
    if (declaration.isTypeOnly()) continue;
    const target = declaration.getModuleSpecifierSourceFile();
    if (target && runtimeEdges.has(target.getFilePath())) runtimeEdges.get(file.getFilePath()).push(target.getFilePath());
  }
}
const visiting = new Set(); const visited = new Set();
function visit(file) {
  if (visiting.has(file)) throw new Error(`runtime import cycle detected at ${path.basename(file)}`);
  if (visited.has(file)) return;
  visiting.add(file); for (const next of runtimeEdges.get(file) ?? []) visit(next); visiting.delete(file); visited.add(file);
}
for (const file of runtimeEdges.keys()) visit(file);

const lineCounts = Object.fromEntries([pagePath, ...["patient-components.tsx", "panel-components.tsx", "pregnancy-components.tsx", "visit-flow-components.tsx", "timeline-components.tsx"].map((name) => path.join(routeDir, name))].map((file) => [path.basename(file), fs.readFileSync(file, "utf8").split(/\r?\n/).length]));
assert.ok(lineCounts["page.tsx"] < 500, "route page must remain an orchestrator");
assert.ok(Math.max(...Object.values(lineCounts)) < 1500, "workspace extraction created another monolith");
console.log(JSON.stringify({ modules: entries.length, minimalisticKeys: entries.filter((entry) => entry.minimalistic).map((entry) => entry.key), lineCounts }));
console.log("Workspace registry, deep links, role visibility, lazy boundaries, imports, and file-size boundaries passed.");
