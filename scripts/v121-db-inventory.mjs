import {
  collectCounts,
  createPrisma,
  currentAppEnv,
  medicationReadiness,
  operationalModels,
  referenceModels,
  writeReports
} from "./v121-reference-utils.mjs";

const prisma = createPrisma();

try {
  const report = {
    sprint: "v0.12.1 Clean Database + Real Reference Foundation",
    generatedAt: new Date().toISOString(),
    appEnv: currentAppEnv(),
    operational: await collectCounts(prisma, operationalModels),
    reference: await collectCounts(prisma, referenceModels),
    medicationReadiness: await medicationReadiness(prisma)
  };
  const markdown = renderMarkdown(report);
  const paths = await writeReports("v121-db-inventory", report, markdown);
  console.log(`V121-INVENTORY wrote ${paths.jsonPath}`);
  console.log(`V121-INVENTORY wrote ${paths.mdPath}`);
  printCounts("operational", report.operational);
  printCounts("reference", report.reference);
  console.log(`V121-INVENTORY medication officialRows=${report.medicationReadiness.officialRows} verifiedRows=${report.medicationReadiness.verifiedRows}`);
} finally {
  await prisma.$disconnect();
}

function renderMarkdown(report) {
  return [
    "# v0.12.1 Local DB Inventory",
    "",
    `Generated: ${report.generatedAt}`,
    `Environment: ${report.appEnv}`,
    "",
    "## Operational Patient-Linked Data",
    table(report.operational),
    "",
    "## Reference/System Data",
    table(report.reference),
    "",
    "## Medication Readiness",
    table(report.medicationReadiness)
  ].join("\n");
}

function table(object) {
  const rows = Object.entries(object).map(([key, value]) => `| ${key} | ${value === null ? "model missing" : value} |`);
  return ["| Item | Count |", "| --- | ---: |", ...rows].join("\n");
}

function printCounts(label, object) {
  const summary = Object.entries(object).map(([key, value]) => `${key}=${value ?? "missing"}`).join(" ");
  console.log(`V121-INVENTORY ${label} ${summary}`);
}
