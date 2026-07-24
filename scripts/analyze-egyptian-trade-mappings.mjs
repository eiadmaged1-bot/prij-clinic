import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { parseOfficialFile } from "./official-medication-utils.mjs";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const prisma = new PrismaClient();
const file = resolve(process.argv[2] ?? "local-reference/egyptian-drugs/egyptian-drugs.csv");
const reportFile = resolve(process.argv[3] ?? "local-reference/egyptian-drugs/mapping-dry-run.json");
const parsed = await parseOfficialFile(file, "EGYPTIAN_DRUG_DATABASE_CC0");
const expectedHash = "43f91aaf53537222dcdcf538c41e125c4e5d65570a77c4e044e38f1ce107f030";
if (parsed.fileSha256 !== expectedHash || parsed.rows.length !== 25094) throw new Error("Source identity gate failed.");

const generics = await prisma.medicationGeneric.findMany({ select: { id: true, genericName: true, normalizedName: true, aliases: true } });
const aliases = await prisma.medicationAlias.findMany({ where: { status: "active" }, select: { medicationGenericId: true, normalizedAlias: true } });
const genericById = new Map(generics.map((item) => [item.id, item]));
const lookup = new Map();
for (const generic of generics) {
  addLookup(generic.normalizedName, generic.id);
  addLookup(generic.genericName, generic.id);
  if (Array.isArray(generic.aliases)) for (const alias of generic.aliases) addLookup(String(alias), generic.id);
}
for (const alias of aliases) addLookup(alias.normalizedAlias, alias.medicationGenericId);

const synonymMap = new Map([
  ["acetaminophen", "paracetamol"],
  ["ascorbic acid", "vitamin c"],
  ["clavulanate", "clavulanic acid"],
  ["amoxycillin", "amoxicillin"]
]);
const accounting = { matchedExisting: 0, matchedAlias: 0, missingGenericProposal: 0, singleIngredient: 0, multiIngredient: 0, duplicateRows: 0, conflictingMappings: 0, ambiguous: 0, unmapped: 0, reviewProposed: 0, skipped: 0, failed: 0 };
const uniqueTrades = new Set();
const uniqueCompositions = new Set();
const sourceFingerprints = new Set();
const tradeMappings = new Map();
const missingGenerics = new Map();
const representatives = [];
const rows = [];

for (const [index, row] of parsed.rows.entries()) {
  try {
    const tradeDisplay = cleanDisplay(row.commercial_name_en);
    const trade = normalizeTrade(tradeDisplay);
    const compositionDisplay = cleanDisplay(row.scientific_name);
    const fingerprint = JSON.stringify(row);
    if (sourceFingerprints.has(fingerprint)) accounting.duplicateRows += 1;
    else sourceFingerprints.add(fingerprint);
    if (!tradeDisplay || !compositionDisplay) {
      accounting.skipped += 1;
      rows.push({ row: index + 1, status: "skipped", reason: !tradeDisplay ? "missing_trade_name" : "missing_composition" });
      continue;
    }
    uniqueTrades.add(trade);
    uniqueCompositions.add(normalizeText(compositionDisplay));
    const ingredients = splitComposition(compositionDisplay);
    if (!ingredients.length) {
      accounting.unmapped += 1; accounting.reviewProposed += 1;
      rows.push({ row: index + 1, trade: tradeDisplay, status: "unmapped", reason: "composition_not_deterministically_parseable" });
      continue;
    }
    const mapped = [];
    const missing = [];
    let aliasMatch = false;
    for (const ingredient of ingredients) {
      const normalized = synonymMap.get(ingredient.normalized) ?? ingredient.normalized;
      const matchedKey = ingredientLookupKeys(normalized).find((key) => (lookup.get(key) ?? []).length > 0);
      const candidates = matchedKey ? lookup.get(matchedKey) ?? [] : [];
      if (candidates.length === 1) {
        const generic = genericById.get(candidates[0]);
        mapped.push({ id: generic.id, genericName: generic.genericName, sourceIngredient: ingredient.display });
        aliasMatch ||= normalized !== ingredient.normalized || matchedKey !== normalized;
      } else if (candidates.length > 1) {
        accounting.ambiguous += 1;
        missing.push({ display: ingredient.display, normalized, reason: "multiple_existing_candidates" });
      } else if (safeMissingIngredient(ingredient.display, normalized)) {
        missing.push({ display: ingredient.display, normalized, reason: "genuine_missing_generic_proposal" });
        missingGenerics.set(normalized, { genericName: titleCase(normalized), normalizedName: normalized });
      } else {
        missing.push({ display: ingredient.display, normalized, reason: "contaminated_or_unreliable_identity" });
      }
    }
    const genericSet = [...new Set(mapped.map((item) => item.id))].sort();
    const priorSets = tradeMappings.get(trade) ?? new Set();
    if (genericSet.length) priorSets.add(genericSet.join("|"));
    tradeMappings.set(trade, priorSets);
    if (priorSets.size > 1) accounting.conflictingMappings += 1;
    let status;
    if (!missing.length && mapped.length === ingredients.length) {
      status = mapped.length > 1 ? "multi_ingredient_link" : "single_ingredient_link";
      accounting.matchedExisting += 1;
      if (aliasMatch) accounting.matchedAlias += 1;
      if (mapped.length > 1) accounting.multiIngredient += 1; else accounting.singleIngredient += 1;
    } else if (missing.every((item) => item.reason === "genuine_missing_generic_proposal")) {
      status = "missing_generic_proposal";
      accounting.missingGenericProposal += 1;
      accounting.reviewProposed += 1;
    } else {
      status = "review_required";
      accounting.reviewProposed += 1;
      if (!mapped.length) accounting.unmapped += 1; else accounting.ambiguous += 1;
    }
    const result = { row: index + 1, trade: tradeDisplay, tradeNormalized: trade, arabicAlias: cleanDisplay(row.commercial_name_ar), composition: compositionDisplay, ingredients, mapped, missing, status };
    rows.push(result);
    if (representatives.length < 30 || /^(panadol|glucophage|augmentin)\b/i.test(tradeDisplay)) representatives.push(result);
  } catch (error) {
    accounting.failed += 1;
    rows.push({ row: index + 1, status: "failed", reason: error instanceof Error ? error.message : "unknown_error" });
  }
}
const duplicateTradeMappings = [...tradeMappings.values()].filter((sets) => sets.size > 1).length;
const report = {
  source: { file, checksum: parsed.fileSha256, rowCount: parsed.rows.length, headers: Object.keys(parsed.rows[0] ?? {}), provenance: "Egyptian Drug Database", license: "CC0-1.0", version: "June 2026" },
  summary: { sourceRowsAnalyzed: rows.length, uniqueNormalizedTradeNames: uniqueTrades.size, uniqueCompositionStrings: uniqueCompositions.size, existingGenericRecords: generics.length, existingAliasRecords: aliases.length, proposedMissingGenerics: missingGenerics.size, duplicateTradeMappings, ...accounting },
  proposedMissingGenerics: [...missingGenerics.values()],
  representatives: representatives.slice(0, 50),
  rows
};
if (rows.length !== parsed.rows.length) throw new Error("Row accounting mismatch.");
await writeFile(reportFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ reportFile, source: report.source, summary: report.summary, representatives: report.representatives.slice(0, 35) }, null, 2));
await prisma.$disconnect();

function addLookup(value, id) {
  const key = normalizeIngredient(value);
  if (!key) return;
  lookup.set(key, [...new Set([...(lookup.get(key) ?? []), id])]);
}
function splitComposition(value) {
  return value.split(/\s*\+\s*/).map((part) => {
    const display = part.replace(/\(([^)]+)\)/g, "").trim();
    return { display, normalized: normalizeIngredient(display), parentheticalAliases: [...part.matchAll(/\(([^)]+)\)/g)].map((match) => normalizeIngredient(match[1])) };
  }).filter((item) => item.normalized);
}
function normalizeIngredient(value) {
  return normalizeText(value).replace(/\b\d+(?:\.\d+)?\s*(?:mcg|μg|mg|gm|g|kg|ml|iu|i\.u\.|%)\b.*$/i, "").replace(/\b(?:anhydrous|hydrate|monohydrate|dihydrate|trihydrate)\b/g, "").replace(/\s+/g, " ").trim();
}
function normalizeTrade(value) {
  return normalizeText(value).replace(/\b\d+(?:\.\d+)?\s*(?:mcg|mg|gm|g|ml|iu|%)\b.*$/i, "").replace(/\b(?:f\.?c\.?tabs?|tablets?|tabs?|caps?(?:ules?)?|susp(?:ension)?|syrup|cream|ointment|amp(?:oules?)?|vials?|spray)\b.*$/i, "").replace(/\s+/g, " ").trim();
}
function ingredientLookupKeys(value) {
  const withoutSalt = value.replace(/\s+(?:hydrochloride|hcl|sodium|potassium|calcium|maleate|citrate|tartrate)\s*$/i, "").trim();
  return [...new Set([value, withoutSalt].filter(Boolean))];
}
function normalizeText(value) { return cleanDisplay(value).toLowerCase().replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim(); }
function cleanDisplay(value) { return String(value ?? "").trim().replace(/\s+/g, " "); }
function safeMissingIngredient(display, normalized) { return Boolean(normalized && normalized.length >= 3 && normalized.length <= 80 && !/\d/.test(normalized) && !/\b(?:tablet|capsule|syrup|cream|manufacturer|unknown|extract|oil|water|flavour)\b/i.test(display)); }
function titleCase(value) { return value.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase()); }
