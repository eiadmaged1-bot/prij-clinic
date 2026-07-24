import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { parseOfficialFile } from "./official-medication-utils.mjs";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const prisma = new PrismaClient();
const SOURCE_CODE = "EGYPTIAN_DRUG_DATABASE_CC0";
const SOURCE_NAME = "Egyptian Drug Database";
const SOURCE_URL = "https://raw.githubusercontent.com/karem505/egyptian-drug-database/main/data/egyptian-drugs.csv";
const REPOSITORY_URL = "https://github.com/karem505/egyptian-drug-database";
const EXPECTED_SHA256 = "43f91aaf53537222dcdcf538c41e125c4e5d65570a77c4e044e38f1ce107f030";
const EXPECTED_ROWS = 25094;
const IMPORTER_VERSION = "egyptian-market-catalogue-v2";
const CONFIRMATION = "ACTIVATE_EGYPTIAN_MARKET_CATALOGUE";
const CLEAN_MISSING_GENERIC_ALLOWLIST = new Set(["clavulanic acid"]);
const args = parseArgs(process.argv.slice(2));
const file = resolve(String(args["local-file"] ?? "local-reference/egyptian-drugs/egyptian-drugs.csv"));
const apply = args["confirm-write"] === CONFIRMATION;

if (args.help) {
  console.log(`Usage:
  npm run drugs:egypt:sync -- --dry-run --local-file <path>
  npm run drugs:egypt:sync -- --confirm-write ${CONFIRMATION} --local-file <path>

Dry-run is strictly read-only. Live mode imports searchable market products and variants,
then links only deterministic existing generic identities. It never deletes records.`);
  process.exit(0);
}
if (args["confirm-write"] && !apply) throw new Error(`Write activation requires --confirm-write ${CONFIRMATION}.`);

try {
  const parsed = await parseOfficialFile(file, SOURCE_CODE);
  if (parsed.fileSha256 !== EXPECTED_SHA256) throw new Error(`Checksum mismatch: ${parsed.fileSha256}`);
  if (parsed.rows.length !== EXPECTED_ROWS) throw new Error(`Row-count mismatch: ${parsed.rows.length}`);
  const prepared = prepareRows(parsed.rows);
  const generics = await prisma.medicationGeneric.findMany({ select: { id: true, genericName: true, normalizedName: true, aliases: true, reviewStatus: true } });
  const scopedAliases = await prisma.medicationAlias.findMany({
    where: { status: "active", NOT: { scopeType: "SOURCE_MARKET" } },
    select: { medicationGenericId: true, normalizedAlias: true }
  });
  const genericLookup = buildGenericLookup(generics, scopedAliases);
  const mappings = mapProducts(prepared.products, genericLookup);
  const proposedMissingGenerics = collectCleanMissingGenerics(mappings);
  const existingVariants = await prisma.drugMarketVariant.findMany({ where: { countryCode: "EG", isDemo: false }, select: { sourceRowHash: true, productId: true, sourceId: true } });
  const existingHashes = new Set(existingVariants.map((row) => row.sourceRowHash).filter(Boolean));
  const summary = {
    status: apply ? "ready_to_write" : "dry_run_complete",
    sourceRows: parsed.rows.length,
    accountedRows: prepared.accountedRows,
    validRows: prepared.rows.length,
    skippedRows: prepared.skipped.length,
    failedRows: 0,
    uniqueProducts: prepared.products.length,
    duplicateSourceRows: prepared.duplicateRows,
    projectedNewVariants: prepared.rows.filter((row) => !existingHashes.has(row.sourceRowHash)).length,
    existingGenericLinks: mappings.filter((item) => item.status === "mapping_confirmed").length,
    combinationLinks: mappings.filter((item) => item.genericIds.length > 1 && item.status === "mapping_confirmed").length,
    mappingsUnderReview: mappings.filter((item) => item.status !== "mapping_confirmed").length,
    proposedMissingGenerics: proposedMissingGenerics.length
  };
  if (prepared.accountedRows !== EXPECTED_ROWS) throw new Error("Source-row accounting mismatch.");
  if (!apply) {
    console.log(JSON.stringify({ source: sourceMetadata(parsed), summary, representatives: representativeMappings(mappings) }, null, 2));
  } else {
    const result = await activateCatalogue(parsed, prepared, mappings, generics, proposedMissingGenerics);
    console.log(JSON.stringify({ source: sourceMetadata(parsed), summary: { ...summary, ...result, status: "imported" } }, null, 2));
  }
} finally {
  await prisma.$disconnect();
}

async function activateCatalogue(parsed, prepared, mappings, generics, proposedMissingGenerics) {
  await prisma.drugMarketCountry.upsert({
    where: { countryCode: "EG" },
    create: { countryCode: "EG", displayName: "Egypt", compactBadgeLabel: "EG", active: true },
    update: { displayName: "Egypt", compactBadgeLabel: "EG", active: true }
  });
  const source = await prisma.drugMarketSource.upsert({
    where: { code: SOURCE_CODE },
    create: { code: SOURCE_CODE, name: SOURCE_NAME, countryCode: "EG", sourceType: "market_reference_dataset", priorityRank: 80, policyStatus: "approved", sourcePolicyStatus: "approved", verificationStatus: "needs_review", websiteUrl: REPOSITORY_URL, officialUrl: SOURCE_URL, sourceAccessMode: "local_verified_file", importerKey: IMPORTER_VERSION, requiresApproval: true, latestSourceLabel: "June 2026", notes: provenanceNote() },
    update: { name: SOURCE_NAME, countryCode: "EG", websiteUrl: REPOSITORY_URL, officialUrl: SOURCE_URL, importerKey: IMPORTER_VERSION, latestSourceLabel: "June 2026", notes: provenanceNote() }
  });
  const run = await prisma.drugMarketImportRun.create({
    data: { sourceId: source.id, status: "running", dryRun: false, rowCount: parsed.rows.length, totalRowsSeen: parsed.rows.length, sourceUrl: SOURCE_URL, sourceFileName: parsed.fileName, sourceFileSha256: parsed.fileSha256, sourceFetchedAt: new Date(), parserName: "egyptian-market-csv", parserVersion: IMPORTER_VERSION, sourceSnapshotJson: sourceMetadata(parsed), coverageJson: { phase: "market_product_import" } }
  });
  await prisma.auditLog.create({ data: { action: "drug_market.egypt_catalogue_activation_started", resourceType: "DrugMarketImportRun", resourceId: run.id, severity: "high", metadataJson: { checksum: parsed.fileSha256, rows: parsed.rows.length, importerVersion: IMPORTER_VERSION } } });

  const createdGenericByName = new Map();
  for (const normalizedName of proposedMissingGenerics) {
    const generic = await prisma.medicationGeneric.upsert({
      where: { normalizedName },
      create: {
        genericName: titleCase(normalizedName),
        normalizedName,
        sourceType: "egyptian_market_mapping",
        reviewStatus: "needs_review",
        isActive: false,
        notes: `Ingredient identity imported from ${SOURCE_NAME}; clinical profile is incomplete and unverified.`
      },
      update: {}
    });
    createdGenericByName.set(normalizedName, generic.id);
  }
  for (const mapping of mappings) {
    const remaining = [];
    for (const missing of mapping.missing) {
      const id = createdGenericByName.get(normalizeIngredient(missing));
      if (id) mapping.genericIds.push(id);
      else remaining.push(missing);
    }
    mapping.missing = remaining;
    mapping.genericIds = [...new Set(mapping.genericIds)];
    if (!remaining.length && mapping.genericIds.length === mapping.ingredients.length && mapping.reason !== "ambiguous") {
      mapping.status = "mapping_confirmed";
      mapping.reason = "confirmed";
    }
  }

  const sourceVariants = await prisma.drugMarketVariant.findMany({ where: { sourceId: source.id, countryCode: "EG", isDemo: false }, include: { product: true } });
  const productByKey = new Map();
  const variantByHash = new Map(sourceVariants.map((variant) => [variant.sourceRowHash, variant]));
  for (const variant of sourceVariants) productByKey.set(productKeyFromStored(variant.product), variant.product);
  const allProducts = await prisma.drugMarketProduct.findMany({ where: { isDemo: false }, take: 50000 });
  for (const product of allProducts) if (!productByKey.has(productKeyFromStored(product))) productByKey.set(productKeyFromStored(product), product);
  const mappingByKey = new Map(mappings.map((item) => [item.key, item]));
  let productsInserted = 0;
  let variantsInserted = 0;
  let variantsUnchanged = 0;

  for (let start = 0; start < prepared.rows.length; start += 100) {
    const chunk = prepared.rows.slice(start, start + 100);
    await prisma.$transaction(async (tx) => {
      for (const row of chunk) {
        if (variantByHash.has(row.sourceRowHash)) {
          variantsUnchanged += 1;
          continue;
        }
        let product = productByKey.get(row.productKey);
        if (!product) {
          const mapping = mappingByKey.get(row.productKey);
          product = await tx.drugMarketProduct.create({
            data: {
              tradeName: row.tradeName,
              genericName: row.composition,
              scientificName: row.composition,
              normalizedSearchText: row.searchText,
              familyText: row.drugClass,
              manufacturer: row.manufacturer,
              verificationStatus: mapping?.status ?? "mapping_under_review",
              isDemo: false,
              dataCompletenessScore: row.confidence,
              latestSourceFetchedAt: new Date()
            }
          });
          productByKey.set(row.productKey, product);
          productsInserted += 1;
        }
        const variant = await tx.drugMarketVariant.create({
          data: {
            productId: product.id,
            countryCode: "EG",
            sourceId: source.id,
            tradeName: row.originalTradeName,
            genericName: row.composition,
            strengthText: row.strength,
            dosageForm: row.form,
            route: row.route,
            packageText: row.packageText,
            manufacturer: row.manufacturer,
            priceText: row.priceText,
            officialPriceText: row.priceText,
            officialPriceAmount: row.price,
            currency: row.price ? "EGP" : null,
            priceSourceId: source.id,
            sourceFetchedAt: new Date(),
            importRunId: run.id,
            parserConfidence: row.confidence,
            officialRowJson: row.raw,
            sourceRowHash: row.sourceRowHash,
            verificationStatus: "needs_review",
            isDemo: false
          }
        });
        variantByHash.set(row.sourceRowHash, variant);
        variantsInserted += 1;
      }
    }, { timeout: 60_000 });
  }

  const aliasesToCreate = [];
  for (const mapping of mappings.filter((item) => item.status === "mapping_confirmed")) {
    for (const genericId of mapping.genericIds) {
      aliasesToCreate.push({ medicationGenericId: genericId, alias: mapping.tradeName, normalizedAlias: mapping.normalizedTrade, aliasType: "TRADE_NAME", scopeType: "SOURCE_MARKET", scopeId: source.id, status: "active" });
      if (mapping.arabicName) aliasesToCreate.push({ medicationGenericId: genericId, alias: mapping.arabicName, normalizedAlias: normalizeText(mapping.arabicName), aliasType: "TRADE_NAME_AR", scopeType: "SOURCE_MARKET", scopeId: source.id, status: "active" });
    }
  }
  const aliasResult = aliasesToCreate.length ? await prisma.medicationAlias.createMany({ data: aliasesToCreate, skipDuplicates: true }) : { count: 0 };
  const expectedAliasKeys = new Set(aliasesToCreate.map((alias) => `${alias.medicationGenericId}|${alias.normalizedAlias}`));
  const sourceAliases = await prisma.medicationAlias.findMany({
    where: { scopeType: "SOURCE_MARKET", scopeId: source.id },
    select: { id: true, medicationGenericId: true, normalizedAlias: true, status: true }
  });
  const unsupportedAliasIds = sourceAliases
    .filter((alias) => alias.status === "active" && !expectedAliasKeys.has(`${alias.medicationGenericId}|${alias.normalizedAlias}`))
    .map((alias) => alias.id);
  const expectedInactiveAliasIds = sourceAliases
    .filter((alias) => alias.status !== "active" && expectedAliasKeys.has(`${alias.medicationGenericId}|${alias.normalizedAlias}`))
    .map((alias) => alias.id);
  const aliasesQuarantined = unsupportedAliasIds.length
    ? (await prisma.medicationAlias.updateMany({ where: { id: { in: unsupportedAliasIds } }, data: { status: "needs_review" } })).count
    : 0;
  if (expectedInactiveAliasIds.length) {
    await prisma.medicationAlias.updateMany({ where: { id: { in: expectedInactiveAliasIds } }, data: { status: "active" } });
  }

  const reviewProducts = mappings.filter((item) => item.status !== "mapping_confirmed").map((mapping) => ({ mapping, product: productByKey.get(mapping.key) })).filter((item) => item.product);
  const existingReviewProductIds = new Set((await prisma.drugMarketManualReviewQueue.findMany({ where: { queueType: { startsWith: "egypt_mapping_" }, status: "open", productId: { in: reviewProducts.map((item) => item.product.id) } }, select: { productId: true } })).map((item) => item.productId));
  const reviewRows = reviewProducts.filter((item) => !existingReviewProductIds.has(item.product.id)).map(({ mapping, product }) => ({ queueType: `egypt_mapping_${mapping.reason}`, productId: product.id, status: "open", reason: `${mapping.reason}: ${mapping.composition}. Frequency ${mapping.frequency}; source ${parsed.fileSha256}.` }));
  if (reviewRows.length) await prisma.drugMarketManualReviewQueue.createMany({ data: reviewRows });

  const touchedProductIds = [...new Set(prepared.products.map((item) => productByKey.get(item.key)?.id).filter(Boolean))];
  for (let start = 0; start < touchedProductIds.length; start += 500) {
    const ids = touchedProductIds.slice(start, start + 500);
    const counts = await prisma.drugMarketVariant.groupBy({ by: ["productId"], where: { productId: { in: ids }, countryCode: "EG", isDemo: false, verificationStatus: { not: "retired" } }, _count: { _all: true } });
    for (const count of counts) await prisma.drugMarketAvailability.upsert({ where: { productId_countryCode: { productId: count.productId, countryCode: "EG" } }, create: { productId: count.productId, countryCode: "EG", variantCount: count._count._all, showCompactBadge: false }, update: { variantCount: count._count._all, showCompactBadge: false } });
  }
  await prisma.officialMedicationSourceSnapshot.create({ data: { sourceId: source.id, countryCode: "EG", sourceName: SOURCE_NAME, sourceUrl: SOURCE_URL, sourceType: "market_reference_dataset", fetchedAt: new Date(), fileName: parsed.fileName, fileSha256: parsed.fileSha256, rowCount: parsed.rows.length, importRunId: run.id, status: "captured", metadataJson: { license: "CC0-1.0", version: "June 2026", importerVersion: IMPORTER_VERSION } } });
  await prisma.drugMarketImportRun.update({ where: { id: run.id }, data: { status: "imported", message: "Egyptian market catalogue activated; generic mappings remain independently review-gated.", rowsImported: prepared.rows.length, rowsNeedsReview: reviewRows.length, rowsSkipped: prepared.skipped.length, rowsFailed: 0, coverageJson: { productsInserted, variantsInserted, variantsUnchanged, aliasesInserted: aliasResult.count, aliasesQuarantined, reviewRecordsInserted: reviewRows.length }, finishedAt: new Date() } });
  await prisma.drugMarketSource.update({ where: { id: source.id }, data: { lastCheckedAt: new Date(), lastSuccessfulImportAt: new Date(), sourceFreshnessStatus: "current_checked_today", coverageStatus: "imported_needs_mapping_review", latestSourceLabel: "June 2026" } });
  await prisma.auditLog.create({ data: { action: "drug_market.egypt_catalogue_activation_completed", resourceType: "DrugMarketImportRun", resourceId: run.id, severity: "high", metadataJson: { productsInserted, variantsInserted, variantsUnchanged, aliasesInserted: aliasResult.count, aliasesQuarantined, reviewRecordsInserted: reviewRows.length, protectedGenerics: generics.length } } });
  return { productsInserted, variantsInserted, variantsUnchanged, aliasesInserted: aliasResult.count, aliasesQuarantined, reviewRecordsInserted: reviewRows.length, missingGenericsInserted: proposedMissingGenerics.length, importRunId: run.id };
}

function prepareRows(rawRows) {
  const rows = [];
  const skipped = [];
  const products = new Map();
  const hashes = new Set();
  let duplicateRows = 0;
  for (const [index, raw] of rawRows.entries()) {
    const originalTradeName = clean(raw.commercial_name_en);
    const composition = clean(raw.scientific_name);
    if (!originalTradeName || !composition) {
      skipped.push({ row: index + 1, reason: !originalTradeName ? "missing_trade_name" : "missing_composition" });
      continue;
    }
    const sourceRowHash = sha256(`EG|${JSON.stringify(raw)}`);
    if (hashes.has(sourceRowHash)) duplicateRows += 1;
    hashes.add(sourceRowHash);
    const tradeName = tradeIdentity(originalTradeName);
    const manufacturer = clean(raw.manufacturer);
    const productKey = productKeyFromValues(tradeName, composition, manufacturer);
    const row = {
      rowNumber: index + 1,
      raw,
      sourceRowHash,
      originalTradeName,
      tradeName,
      arabicName: clean(raw.commercial_name_ar),
      composition,
      manufacturer,
      drugClass: clean(raw.drug_class),
      route: clean(raw.route),
      strength: extractStrength(originalTradeName),
      form: extractForm(originalTradeName),
      packageText: originalTradeName,
      priceText: clean(raw.price_egp),
      price: decimalOrNull(raw.price_egp),
      confidence: 0.85,
      productKey,
      searchText: normalizeText([tradeName, originalTradeName, raw.commercial_name_ar, composition, manufacturer, raw.drug_class, raw.route].filter(Boolean).join(" "))
    };
    rows.push(row);
    const product = products.get(productKey) ?? { key: productKey, tradeName, normalizedTrade: normalizeText(tradeName), arabicName: row.arabicName, composition, manufacturer, drugClass: row.drugClass, frequency: 0 };
    product.frequency += 1;
    products.set(productKey, product);
  }
  return { rows, skipped, products: [...products.values()], duplicateRows, accountedRows: rows.length + skipped.length };
}

function mapProducts(products, lookup) {
  return products.map((product) => {
    const ingredients = splitComposition(product.composition);
    const genericIds = [];
    const missing = [];
    let ambiguous = false;
    for (const ingredient of ingredients) {
      const candidates = [];
      for (const key of ingredientKeys(ingredient)) {
        for (const id of lookup.get(normalizeIngredient(key)) ?? []) candidates.push(id);
      }
      const ids = [...new Set(candidates)];
      if (ids.length === 1) genericIds.push(ids[0]);
      else if (ids.length > 1) ambiguous = true;
      else missing.push(ingredient);
    }
    const status = !ambiguous && !missing.length && genericIds.length === ingredients.length ? "mapping_confirmed" : "mapping_under_review";
    const reason = ambiguous ? "ambiguous" : missing.length && genericIds.length ? "combination_incomplete" : missing.length ? "missing_generic" : "unmapped";
    return { ...product, ingredients, genericIds: [...new Set(genericIds)], missing, status, reason };
  });
}

function collectCleanMissingGenerics(mappings) {
  const candidates = new Set();
  for (const mapping of mappings) {
    for (const missing of mapping.missing) {
      const normalized = normalizeIngredient(missing);
      if (CLEAN_MISSING_GENERIC_ALLOWLIST.has(normalized)) candidates.add(normalized);
    }
  }
  return [...candidates].sort();
}

function buildGenericLookup(generics, aliases) {
  const lookup = new Map();
  const add = (key, id) => {
    const normalized = normalizeIngredient(key);
    if (!normalized) return;
    lookup.set(normalized, [...new Set([...(lookup.get(normalized) ?? []), id])]);
  };
  for (const generic of generics) {
    add(generic.genericName, generic.id);
    add(generic.normalizedName, generic.id);
    if (Array.isArray(generic.aliases)) for (const alias of generic.aliases) add(String(alias), generic.id);
  }
  for (const alias of aliases) add(alias.normalizedAlias, alias.medicationGenericId);
  return lookup;
}

function splitComposition(value) {
  return value.split(/\s*\+\s*/).map((part) => normalizeIngredient(part.replace(/\(([^)]+)\)/g, ""))).filter(Boolean);
}
function ingredientKeys(value) {
  const synonyms = { acetaminophen: "paracetamol", amoxycillin: "amoxicillin", "ascorbic acid": "vitamin c" };
  const base = value.replace(/\s+(?:hydrochloride|hcl|sodium|potassium|calcium|maleate|citrate|tartrate)\s*$/i, "").trim();
  return [...new Set([value, base, synonyms[value], synonyms[base]].filter(Boolean))];
}
function normalizeIngredient(value) {
  return normalizeText(value).replace(/\b\d+(?:\.\d+)?\s*(?:mcg|μg|mg|gm|g|kg|ml|iu|i u|%)\b.*$/i, "").replace(/\b(?:anhydrous|hydrate|monohydrate|dihydrate|trihydrate)\b/g, "").replace(/\s+/g, " ").trim();
}
function tradeIdentity(value) {
  return clean(value).replace(/\s+\d+(?:[.,]\d+)?\s*(?:MCG|MG|GM|G|ML|I\.?U\.?|%)\b.*$/i, "").replace(/\s+(?:F\.?C\.?\s*)?(?:TABS?|TABLETS?|CAPS?(?:ULES?)?|SUSP\.?|SYRUP|CREAM|OINTMENT|VIALS?|AMPS?|SPRAY)\b.*$/i, "").trim() || clean(value);
}
function extractStrength(value) { return value.match(/\b\d+(?:[.,]\d+)?\s*(?:MCG|MG|GM|G|ML|I\.?U\.?|%)\b/i)?.[0] ?? null; }
function extractForm(value) { return value.match(/\b(?:F\.?C\.?\s*TABS?|TABLETS?|CAPS?(?:ULES?)?|SUSP(?:ENSION)?|SYRUP|CREAM|OINTMENT|VIALS?|AMPS?(?:OULES?)?|SPRAY|DROPS?|SACHETS?)\b/i)?.[0] ?? null; }
function productKeyFromValues(tradeName, composition, manufacturer) { return `${normalizeText(tradeName)}|${normalizeIngredient(composition)}|${normalizeText(manufacturer)}`; }
function productKeyFromStored(product) { return productKeyFromValues(product.tradeName, product.scientificName ?? product.genericName ?? "", product.manufacturer ?? ""); }
function normalizeText(value) { return clean(value).toLowerCase().replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim(); }
function clean(value) { return String(value ?? "").trim().replace(/\s+/g, " "); }
function titleCase(value) { return value.replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function decimalOrNull(value) { const parsed = Number(String(value ?? "").replace(/,/g, "")); return Number.isFinite(parsed) && parsed >= 0 ? parsed : null; }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function parseArgs(argv) { const result = {}; for (let index = 0; index < argv.length; index += 1) { const key = argv[index]; if (!key.startsWith("--")) continue; const next = argv[index + 1]; if (!next || next.startsWith("--")) result[key.slice(2)] = true; else { result[key.slice(2)] = next; index += 1; } } return result; }
function sourceMetadata(parsed) { return { name: SOURCE_NAME, repositoryUrl: REPOSITORY_URL, sourceUrl: SOURCE_URL, license: "CC0-1.0", version: "June 2026", file: parsed.fileName, sha256: parsed.fileSha256, rows: parsed.rows.length, importerVersion: IMPORTER_VERSION }; }
function representativeMappings(mappings) {
  const required = ["panadol", "glucophage", "augmentin"];
  const picked = required.flatMap((term) => mappings.filter((item) => item.normalizedTrade.includes(term)).slice(0, 2));
  return [...picked, ...mappings.filter((item) => item.status === "mapping_confirmed").slice(0, 12), ...mappings.filter((item) => item.genericIds.length > 1).slice(0, 6), ...mappings.filter((item) => item.status !== "mapping_confirmed").slice(0, 10)].slice(0, 35).map((item) => ({ tradeName: item.tradeName, arabicName: item.arabicName, composition: item.composition, status: item.status, linkedGenericCount: item.genericIds.length, missing: item.missing, frequency: item.frequency }));
}
function provenanceNote() { return `Source: ${SOURCE_NAME}\nRepository: ${REPOSITORY_URL}\nFile: ${SOURCE_URL}\nLicense: CC0-1.0\nDataset update: June 2026\nMarket identity and reference price only; no clinical safety, dose, pregnancy, lactation, interaction, contraindication, renal, or hepatic guidance.`; }
