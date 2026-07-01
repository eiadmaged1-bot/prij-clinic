import assert from "node:assert/strict";
import { resolve } from "node:path";
import { computeSourceRowHash, normalizeOfficialRow, parseOfficialMedicationFile } from "./v100-official-medication-reimport.mjs";

const nhraFile = resolve("scripts/fixtures/official-medication/nhra-synthetic.csv");
const omanFile = resolve("scripts/fixtures/official-medication/oman-moh-synthetic.csv");

const nhra = parseOfficialMedicationFile({ file: nhraFile, source: "NHRA", country: "BH" });
assert.equal(nhra.dbCountryCode, "BHR");
assert.equal(nhra.records.length, 2);
assert.equal(nhra.records[0].tradeName, "Fixture BH Alpha");
assert.equal(nhra.records[0].genericName, "Fixture ingredient A");
assert.equal(nhra.records[0].strengthText, "10 mg");
assert.equal(nhra.records[0].dosageForm, "Tablet");
assert.equal(nhra.records[0].registrationNumber, "BH-FIX-001");
assert.equal(nhra.records[0].verificationStatus, "needs_review");
assert.equal(nhra.records[1].verificationStatus, "verified");

const oman = parseOfficialMedicationFile({ file: omanFile, source: "OMAN_MOH", country: "OM" });
assert.equal(oman.dbCountryCode, "OMN");
assert.equal(oman.records.length, 2);
assert.equal(oman.records[0].tradeName, "Fixture OM Alpha");
assert.equal(oman.records[0].genericName, "Fixture ingredient C");
assert.equal(oman.records[0].strengthText, "5 mg/5 ml");
assert.equal(oman.records[0].dosageForm, "Syrup");
assert.equal(oman.records[0].registrationNumber, "OM-FIX-001");
assert.equal(oman.records[0].verificationStatus, "needs_review");

const hashA = computeSourceRowHash({
  source: "OMAN_MOH",
  dbCountryCode: "OMN",
  tradeName: oman.records[0].tradeName,
  genericName: oman.records[0].genericName,
  strengthText: oman.records[0].strengthText,
  dosageForm: oman.records[0].dosageForm,
  registrationNumber: oman.records[0].registrationNumber,
  row: { b: "2", a: "1" }
});
const hashB = computeSourceRowHash({
  source: "OMAN_MOH",
  dbCountryCode: "OMN",
  tradeName: oman.records[0].tradeName,
  genericName: oman.records[0].genericName,
  strengthText: oman.records[0].strengthText,
  dosageForm: oman.records[0].dosageForm,
  registrationNumber: oman.records[0].registrationNumber,
  row: { a: "1", b: "2" }
});
assert.equal(hashA, hashB);

const uniqueHashes = new Set(oman.records.map((record) => record.sourceRowHash));
assert.equal(uniqueHashes.size, 1);

const normalized = normalizeOfficialRow({
  source: "GENERIC",
  dbCountryCode: "BHR",
  rowNumber: 1,
  row: {
    "Brand Name": "Fixture Generic",
    Composition: "Fixture ingredient",
    "Strength Text": "1 mg",
    Form: "Drops",
    "License Number": "GEN-FIX-1",
    dose: "should not persist",
    Frequency: "should not persist",
    Instructions: "should not persist"
  }
});
assert.equal(normalized.verificationStatus, "needs_review");
assert.equal(Object.prototype.hasOwnProperty.call(normalized.officialRowJson, "dose"), false);
assert.equal(Object.prototype.hasOwnProperty.call(normalized.officialRowJson, "Frequency"), false);
assert.equal(Object.prototype.hasOwnProperty.call(normalized.officialRowJson, "Instructions"), false);
assert.equal(normalized.isDemo, false);

console.log("V100 official medication reimport parser tests passed");
