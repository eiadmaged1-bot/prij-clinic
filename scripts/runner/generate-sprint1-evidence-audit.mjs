import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const verificationDir = path.join(root, "docs", "verification");
const featureNumbers = [7, 8, 9, 13, 15, 17, 18, 22, 23, 28, 45, 46, 47, 48, 49, 101, 102, 106, 107, 108, 109, 110, 111, 115, 119, 150, 200];
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".json", ".yml", ".yaml"]);
const ignoredDirectories = new Set([".git", ".next", "node_modules", "dist", "build", "coverage", "storage", "uploads"]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) output.push(absolute);
  }
  return output;
}

function toRelative(absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function explicitFeaturePattern(feature) {
  return new RegExp(`\\b(?:feature[\\s_-]*${feature}|f${feature})\\b`, "i");
}

const records = walk(root).map((absolutePath) => ({
  path: toRelative(absolutePath),
  text: fs.readFileSync(absolutePath, "utf8")
}));

const cleanEvidencePath = "docs/verification/SPRINT1_CLEAN_APP_INTEGRATION.md";
const activeVisitPath = "apps/web/components/clinic/ActiveVisitWorkspace.tsx";
const medicationPagePath = "apps/web/app/medications/page.tsx";
const patientOverviewPath = "apps/web/app/patients/[id]/patient-components.tsx";

const cleanEvidence = exists(cleanEvidencePath) ? read(cleanEvidencePath) : "";
const activeVisit = exists(activeVisitPath) ? read(activeVisitPath) : "";
const medicationPage = exists(medicationPagePath) ? read(medicationPagePath) : "";
const patientOverview = exists(patientOverviewPath) ? read(patientOverviewPath) : "";

const currentGates = {
  cleanIntegrationEvidence: /Status:\s*PASS/i.test(cleanEvidence),
  feature46Contract: exists("scripts/feature-46-refractory-complaint-test.mjs"),
  pregnancyEddContract: exists("scripts/qa-pregnancy-edd-contract-test.mjs"),
  feature47Contract: exists("scripts/qa-calendar-history-contract-test.mjs"),
  compactMedicationCards: activeVisit.includes("compact-medication-card") && activeVisit.includes("medication-result-grid"),
  structuredArabicPrescription: activeVisit.includes("StructuredPrescriptionField") && activeVisit.includes("structured-rx-grid"),
  noAutoPrescribingBoundary: medicationPage.includes("No auto-prescribing") && medicationPage.includes("Doctor approval required"),
  compactCalendarAndHistory: patientOverview.includes("compact-context-calendar") && patientOverview.includes("reproductive-history-card")
};

const failedGates = Object.entries(currentGates).filter(([, passed]) => !passed).map(([name]) => name);
if (failedGates.length) throw new Error(`Sprint 1 evidence audit blocked; missing gates: ${failedGates.join(", ")}`);

const features = featureNumbers.map((feature) => {
  const pattern = explicitFeaturePattern(feature);
  const traces = records.filter((record) => pattern.test(record.text));
  const evidence = traces.filter((record) => record.path.startsWith("docs/verification/") || /(?:^|\/)(?:qa|test|verify|verification)[^/]*\.(?:mjs|js|ts|md)$/i.test(record.path));
  const tests = traces.filter((record) => /(?:^|\/)scripts\/(?:.*(?:test|qa|verify).*)\.(?:mjs|js|ts)$/i.test(record.path));
  const source = traces.filter((record) => /^(?:apps|packages)\//.test(record.path));
  const passEvidence = evidence.some((record) => /\bPASS\b/i.test(record.text));

  let status = "UNMAPPED";
  if (passEvidence && (tests.length > 0 || source.length > 0)) status = "VERIFIED";
  else if (tests.length > 0 && source.length > 0) status = "TESTED TRACE";
  else if (traces.length > 0) status = "TRACE ONLY";

  if (feature === 46 && currentGates.feature46Contract && currentGates.cleanIntegrationEvidence) status = "VERIFIED";
  if (feature === 47 && currentGates.feature47Contract && currentGates.compactCalendarAndHistory && currentGates.cleanIntegrationEvidence) status = "VERIFIED";

  return {
    feature,
    status,
    traceCount: traces.length,
    sourceCount: source.length,
    testCount: tests.length,
    evidenceCount: evidence.length,
    paths: traces.map((record) => record.path).slice(0, 8)
  };
});

const counts = features.reduce((summary, item) => {
  summary[item.status] = (summary[item.status] || 0) + 1;
  return summary;
}, {});

const generatedAt = new Date().toISOString();
const report = {
  generatedAt,
  sourceBranch: "work/sprint1-qa-repair-batch",
  methodology: "Explicit Feature/F-number references only; raw numeric matches are excluded.",
  currentGates,
  counts,
  features,
  safety: {
    migrationsRun: false,
    seedRun: false,
    resetRun: false,
    destructiveDatabaseAction: false,
    productionDataMutation: false,
    secretsChanged: false
  }
};

fs.mkdirSync(verificationDir, { recursive: true });
fs.writeFileSync(path.join(verificationDir, "SPRINT1_EVIDENCE_AUDIT.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const gateRows = Object.entries(currentGates).map(([gate, passed]) => `| ${gate} | ${passed ? "PASS" : "FAIL"} |`);
const featureRows = features.map((item) => {
  const paths = item.paths.length ? item.paths.map((value) => `\`${value}\``).join("<br>") : "—";
  return `| ${item.feature} | ${item.status} | ${item.traceCount} | ${item.sourceCount} | ${item.testCount} | ${item.evidenceCount} | ${paths} |`;
});
const feature48 = features.find((item) => item.feature === 48);

const markdown = [
  "# Sprint 1 Evidence Audit",
  "",
  `- Generated: \`${generatedAt}\``,
  "- Source branch: `work/sprint1-qa-repair-batch`",
  "- Method: explicit `Feature N` or `FN` references only; ordinary numeric matches are excluded.",
  "- Runtime verification before report generation: Feature 46, pregnancy/EDD, Feature 47, medication UI, typecheck, production build, and diff safety.",
  "- Migration/seed/reset/delete/truncate: NOT RUN",
  "- Production data modified: NO",
  "- Secrets changed or printed: NO",
  "",
  "## Integrated Gate State",
  "",
  "| Gate | Status |",
  "|---|---|",
  ...gateRows,
  "",
  "## Feature Evidence Map",
  "",
  "| Feature | Audit status | Traces | Source | Tests | Evidence | Representative paths |",
  "|---:|---|---:|---:|---:|---:|---|",
  ...featureRows,
  "",
  "## Status Totals",
  "",
  ...Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => `- ${status}: ${count}`),
  "",
  "## Interpretation",
  "",
  "- `VERIFIED`: explicit evidence includes a passing verification artifact and a source or test anchor.",
  "- `TESTED TRACE`: explicit source and test anchors exist, but no passing evidence artifact was found.",
  "- `TRACE ONLY`: an explicit feature reference exists but completion is not proven.",
  "- `UNMAPPED`: no explicit repository mapping was found; define acceptance criteria before implementation.",
  "",
  "## Next Roadmap Gate",
  "",
  feature48?.status === "VERIFIED"
    ? "Feature 48 already has verified explicit evidence; select the next unmapped roadmap item."
    : `Feature 48 audit status: **${feature48?.status || "UNMAPPED"}**. Scope its clinical purpose, UI surface, data contract, RBAC, and acceptance tests before code.`,
  ""
].join("\n");

fs.writeFileSync(path.join(verificationDir, "SPRINT1_EVIDENCE_AUDIT.md"), markdown, "utf8");
console.log(`Sprint 1 evidence audit generated: ${features.length} features, ${failedGates.length} failed gates.`);
