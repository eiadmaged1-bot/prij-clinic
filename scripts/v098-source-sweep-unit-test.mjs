import { strict as assert } from "node:assert";
import { classifyCandidate, containsSecretSignal, shouldSkipDirName } from "./v098-medication-source-utils.mjs";

const previousExport = classifyCandidate({
  path: "C:\\Newfolder\\prij-clinic\\storage\\official-medication-exports\\official-medication-data-2026.jsonl",
  extension: ".jsonl",
  headers: ["id", "tradeName", "genericName", "countryCode", "verificationStatus", "sourceRowHash", "isDemo"],
  sampleText: "official-medication-jsonl-v1 DrugMarketVariant verified",
  sizeBytes: 1000
});

assert.equal(previousExport.confidence, "high");
assert.equal(previousExport.artifactKind, "previous app export");
assert.equal(previousExport.mayContainVerificationStatus, true);
assert.ok(previousExport.detectedColumns.includes("tradeName"));

const rawOfficial = classifyCandidate({
  path: "C:\\Users\\SuperUser\\Downloads\\Bahrain_NHRA_registered_medicines.xlsx",
  extension: ".xlsx",
  headers: ["Trade Name", "Generic Name", "Registration Number", "Dosage Form"],
  sampleText: "",
  sizeBytes: 2000
});

assert.equal(rawOfficial.artifactKind, "raw official source");
assert.equal(rawOfficial.confidence, "medium");
assert.equal(rawOfficial.likelyCountrySource, "Bahrain/NHRA");

const backup = classifyCandidate({
  path: "C:\\Newfolder\\old-prij-clinic\\backup\\drug_market_restore.backup",
  extension: ".backup",
  headers: [],
  sampleText: "",
  sizeBytes: 5000
});

assert.equal(backup.artifactKind, "possible DB backup");

for (const name of ["node_modules", ".git", ".next", "dist", "build", "playwright-report", "test-results"]) {
  assert.equal(shouldSkipDirName(name), true, `${name} should be skipped`);
}

assert.equal(containsSecretSignal("OPENAI_API_KEY=secret"), true);
assert.equal(containsSecretSignal("tradeName,genericName,registrationNumber"), false);

console.log("V098 SOURCE SWEEP UNIT TEST PASS");
