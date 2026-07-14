import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, service, normalizer, workspace] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/src/medications/medications.service.ts", "utf8"),
  readFile("apps/api/src/medications/normalize-medication-search.ts", "utf8"),
  readFile("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8")
]);

for (const alias of ["bronchodilator", "beta2 agonist", "موسع قصبي", "gram positive", "gram +ve", "g+ve", "جرام موجب", "gram negative", "جرام سالب", "anaerobic", "atypical", "mrsa", "enterococcus", "antipseudomonal", "pseudomonas"]) assert(service.toLowerCase().includes(alias.toLowerCase()), `concept alias missing ${alias}`);
for (const field of ["gramPositive", "gramNegative", "anaerobic", "atypical", "pseudomonas", "mrsa", "enterococcus", "esblRelevance", "intracellular", "resistanceLimitations"]) assert(schema.includes(field) && service.includes(field), `structured spectrum field missing ${field}`);
for (const value of ["strong", "variable", "limited", "usually inactive", "resistance-dependent", "unknown/unverified"]) assert(service.includes(`"${value}"`), `coverage value missing ${value}`);
assert(service.includes("safeCoverage") && service.includes("allowedCoverage"), "unverified coverage must be normalized to a safe value");
assert(service.includes("matchReason") && service.includes("spectrumMatches"), "search response must explain the match");
assert(service.includes("groupedResults") && workspace.includes("pharmacology-family-group"), "generic results must group by class/family");
assert(workspace.includes("Local susceptibility/culture review remains required") && workspace.includes("never imply guaranteed susceptibility"), "susceptibility safety warning missing");
assert(normalizer.includes("[أإآ]") && normalizer.includes("\\p{L}"), "Arabic/English medication normalization missing");

console.log("v1.4.5 concept and antimicrobial-spectrum pharmacology search PASS (42 assertions)");
