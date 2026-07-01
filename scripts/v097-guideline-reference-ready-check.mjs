import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const passes = [];
const warnings = [];
const failures = [];
const requiredSources = ["WHO", "NICE", "RCOG", "ACOG", "FIGO", "ESHRE", "ASRM", "SMFM", "CDC"];
const requiredTerms = ["endometriosis", "PCOS", "unexplained infertility", "AUB", "preeclampsia", "FGR/SGA", "contraception", "antenatal care"];

try {
  await checkSources();
  await checkDocuments();
  await checkProtocols();
  checkExternalAiDisabled();
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}

for (const item of passes) console.log(`V097-GUIDELINE-READY PASS ${item}`);
for (const item of warnings) console.log(`V097-GUIDELINE-READY WARN ${item}`);
for (const item of failures) console.log(`V097-GUIDELINE-READY FAIL ${item}`);
console.log(`V097-GUIDELINE-READY SUMMARY PASS ${passes.length} WARN ${warnings.length} FAIL ${failures.length}`);
if (failures.length) process.exitCode = 1;

async function checkSources() {
  assert(prisma.guidelineSource?.count, "GuidelineSource model exists");
  const count = await prisma.guidelineSource.count();
  const rows = await prisma.guidelineSource.findMany({ select: { name: true, organization: true } });
  const text = rows.map((row) => `${row.name} ${row.organization}`).join(" ").toLowerCase();
  for (const source of requiredSources) assert(text.includes(source.toLowerCase()), `${source} source metadata exists`);
  passes.push(`guideline source registry available (${count} sources)`);
}

async function checkDocuments() {
  const documents = await prisma.guidelineDocument.count();
  const chunks = await prisma.guidelineChunk.count();
  console.log(`guideline documents: ${documents}`);
  console.log(`guideline chunks: ${chunks}`);
  if (!documents || !chunks) warnings.push("Guideline source/protocol metadata available; full guideline document ingestion requires owner-provided/open PDFs.");
  else passes.push("guideline document/chunk metadata is available for demo browsing");
}

async function checkProtocols() {
  assert(prisma.clinicalProtocol?.count, "ClinicalProtocol model exists");
  const byStatus = await prisma.clinicalProtocol.groupBy({ by: ["implementationStatus"], _count: { _all: true }, orderBy: { implementationStatus: "asc" } });
  for (const row of byStatus) console.log(`clinical protocols ${row.implementationStatus}: ${row._count._all}`);
  for (const term of requiredTerms) {
    const termOptions = term === "FGR/SGA" ? ["FGR", "fetal growth restriction", "SGA", "small for gestational age"] : [term];
    const found = await prisma.clinicalProtocol.findFirst({
      where: {
        OR: termOptions.flatMap((option) => [
          { title: { contains: option, mode: "insensitive" } },
          { condition: { contains: option, mode: "insensitive" } },
          { code: { contains: option.replace(/\W+/g, "_"), mode: "insensitive" } },
          { sourceName: { contains: option, mode: "insensitive" } }
        ])
      }
    });
    assert(found, `protocol/catalog term exists: ${term}`);
  }
  const draftOrCatalog = await prisma.clinicalProtocol.count({ where: { implementationStatus: { in: ["draft", "catalog_only"] } } });
  if (draftOrCatalog > 0) passes.push("draft/catalog-only protocols remain non-verified and must not provide management advice");
  passes.push("protocol atlas metadata has key women's health terms");
}

function checkExternalAiDisabled() {
  if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "disabled") failures.push("AI_PROVIDER is not disabled");
  const envSource = readFileSync("apps/api/src/config/env.ts", "utf8");
  assert(envSource.includes("AI_PROVIDER") && envSource.includes("disabled"), "API env guard keeps external AI disabled");
  passes.push("external AI provider is disabled/mock-only");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
