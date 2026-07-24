import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
require("reflect-metadata");
const { PrismaService } = require("../apps/api/dist/prisma/prisma.service.js");
const { MedicationSearchService } = require("../apps/api/dist/medications/medication-search.service.js");
const prisma = new PrismaService();
const service = new MedicationSearchService(prisma);

try {
  const searches = {};
  for (const query of ["Panadol", "Paracetamol", "Pa", "Glucophage", "Metformin", "Augmentin", "Amoxicillin", "\u0623\u0648\u062c\u0645\u064a\u0646\u062a\u064a\u0646", "\u062c\u0644\u0648\u0643\u0648\u0641\u0627\u062c\u064a"]) {
    const startedAt = Date.now();
    const response = await service.search(query, 10);
    searches[query] = { milliseconds: Date.now() - startedAt, results: response.results };
    assert(response.results.length > 0, `${query} returned no results`);
    assert(searches[query].milliseconds < 500, `${query} search exceeded 500ms`);
  }
  assert(searches.Panadol.results.some((result) => result.tradeName?.toLowerCase().startsWith("panadol")));
  assert.equal(searches.Paracetamol.results[0]?.type, "generic_medication");
  const paTop = searches.Pa.results.slice(0, 6);
  assert(paTop.some((result) => result.tradeName?.toLowerCase().startsWith("panadol")));
  assert(paTop.some((result) => result.genericName?.toLowerCase() === "paracetamol"));
  assert(searches.Glucophage.results.some((result) => result.linkedGenericId && result.genericName?.toLowerCase() === "metformin"));
  const augmentin = searches.Augmentin.results.find((result) => result.tradeName?.toLowerCase().startsWith("augmentin"));
  assert(augmentin?.genericName?.toLowerCase().includes("amoxicillin"));
  assert(augmentin?.genericName?.toLowerCase().includes("clavulanic acid"));
  assert(searches["\u0623\u0648\u062c\u0645\u064a\u0646\u062a\u064a\u0646"].results.some((result) => result.tradeName?.toLowerCase().startsWith("augmentin")));
  console.log(JSON.stringify({ status: "PASS", timings: Object.fromEntries(Object.entries(searches).map(([query, value]) => [query, value.milliseconds])) }));
} finally {
  await prisma.$disconnect();
}
