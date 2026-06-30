import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { load as loadHtml } from "cheerio";
import { read, utils as xlsxUtils } from "xlsx";

loadEnvFile(".env");

export const prisma = new PrismaClient();

export const countrySourceDefaults = {
  KSA: "SFDA_DRUGS_LIST",
  EG: "EDA_EGYPTIAN_DRUG_REGISTER",
  UAE: "UAE_MOHAP_REGISTERED_MEDICAL_PRODUCT_DIRECTORY",
  QAT: "QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
  KWT: "KUWAIT_MOH_DRUG_PRICE_LIST",
  BHR: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST",
  OMN: "OMAN_OFFICIAL_FILE_UPLOAD",
  YEM: "YEMEN_OFFICIAL_FILE_UPLOAD"
};

export const countryCurrency = {
  EG: "EGP",
  KSA: "SAR",
  UAE: "AED",
  QAT: "QAR",
  KWT: "KWD",
  BHR: "BHD",
  OMN: "OMR",
  YEM: "YER"
};

const storageRoot = resolve("storage", "official-medication-sources");
const blockedUrlPattern = /(login|signin|captcha|paywall|checkout|cart|order|stock|availability|purchase)/i;

const officialSourceCandidates = {
  QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES: [
    "https://www.moph.gov.qa/Admin/Lists/PublicationsAttachments/Attachments/66/Priced%20Products%20%2815-08-2025%29.xlsx"
  ],
  BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST: [
    "https://www.nhra.bh/Departments/PPR/MediaHandler/GenericHandler/documents/departments/PPR/Medicines/List/Registered%20Medicine%20Price%20List.xlsx",
    "https://www.nhra.bh/MediaHandler/GenericHandler/documents/departments/PPR/Medicines/List/Registered%20Medicine%20Price%20List.xlsx"
  ],
  KUWAIT_MOH_DRUG_PRICE_LIST: [
    "https://www.moh.gov.kw/Portal/Modules/DrugPriceList/DrugPriceList.pdf"
  ],
  KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST: [
    "https://www.moh.gov.kw/Portal/Modules/DrugPriceList/FoodSupplementPriceList.pdf"
  ]
};

const officialDomainsBySource = {
  QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES: ["moph.gov.qa", "www.moph.gov.qa"],
  BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST: ["nhra.bh", "www.nhra.bh"],
  BAHRAIN_NHRA_LICENSED_MEDICINES_OPEN_DATA: ["nhra.bh", "www.nhra.bh"],
  KUWAIT_MOH_DRUG_PRICE_LIST: ["moh.gov.kw", "www.moh.gov.kw"],
  KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST: ["moh.gov.kw", "www.moh.gov.kw"],
  SFDA_DRUGS_LIST: ["sfda.gov.sa", "www.sfda.gov.sa"],
  EDA_EDDB_SEARCH: ["eddb.edaegypt.gov.eg"],
  EDA_EGYPTIAN_DRUG_REGISTER: ["edaegypt.gov.eg", "www.edaegypt.gov.eg"],
  EDA_OFFICIAL_FILE_UPLOAD: ["edaegypt.gov.eg", "www.edaegypt.gov.eg"]
};

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = "true";
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

export function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function rowHash(row, countryCode) {
  return createHash("sha256").update(`${countryCode}|${JSON.stringify(row)}`).digest("hex");
}

export function parseOfficialFile(filePath) {
  const absolute = resolve(filePath);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error(`Official source file not found: ${filePath}`);
  const extension = extname(absolute).toLowerCase();
  const buffer = readFileSync(absolute);
  if (extension === ".json") {
    const parsed = JSON.parse(buffer.toString("utf8"));
    return { fileName: basename(absolute), fileSha256: sha256Buffer(buffer), rows: Array.isArray(parsed) ? parsed : parsed.rows ?? [], parserName: "generic-official-json" };
  }
  if (extension === ".csv") {
    const rows = parseCsv(buffer.toString("utf8"));
    return { fileName: basename(absolute), fileSha256: sha256Buffer(buffer), rows, parserName: "generic-official-csv" };
  }
  if ([".xlsx", ".xls"].includes(extension)) {
    return { fileName: basename(absolute), fileSha256: sha256Buffer(buffer), rows: parseXlsxRows(buffer), parserName: "generic-official-xlsx" };
  }
  if (extension === ".pdf") {
    return { fileName: basename(absolute), fileSha256: sha256Buffer(buffer), rows: parsePdfLikeText(buffer.toString("latin1")), parserName: "generic-official-pdf-text" };
  }
  throw new Error(`${extension || "file"} parsing is not supported for official imports.`);
}

export async function executeOfficialImport({ countryCode, sourceCode, mode = "live", file, maxPages }) {
  const source = await getSource(countryCode, sourceCode);
  if (mode === "upload-required" || source.sourceAccessMode === "official_upload" || source.sourceAccessMode === "gated_manual_required") {
    if (!file) {
      const run = await recordBlockedRun(source, "needs_review", "Official owner-provided file is required. No fallback rows were created.");
      return { source: source.code, status: run.status, rowsImported: 0, rowsSeen: 0, reason: run.message };
    }
  }

  if (isSourceGated(source) && !file) {
    const run = await recordBlockedRun(source, "needs_review", "Source is gated or requires approved API access. No bypass attempted.");
    return { source: source.code, status: run.status, rowsImported: 0, rowsSeen: 0, reason: run.message };
  }

  let parsed;
  let snapshot = {};
  if (file) {
    parsed = parseOfficialFile(file);
    snapshot = { sourceUrl: source.officialUrl ?? source.websiteUrl, finalUrl: source.officialUrl ?? source.websiteUrl, fetchedAt: new Date(), filePath: resolve(file) };
  } else {
    const downloaded = await discoverAndFetchOfficialSource(source, { maxPages });
    parsed = parseDownloadedSource(downloaded, source);
    snapshot = downloaded;
  }

  return importParsedOfficialRows({ source, countryCode: source.countryCode ?? countryCode, mode, parsed, snapshot });
}

export async function discoverAndFetchOfficialSource(source, options = {}) {
  const candidates = [...(officialSourceCandidates[source.code] ?? [])];
  if (source.code === "SFDA_DRUGS_LIST") {
    return fetchSfdaPublicRows(source, options);
  }
  if (source.officialUrl) {
    try {
      const discovered = await discoverVisibleFileLinks(source, source.officialUrl);
      candidates.push(...discovered);
    } catch {
      // Discovery failure is reported if all explicit candidates also fail.
    }
  }
  const failures = [];
  for (const candidate of candidates) {
    try {
      return await fetchOfficialFile(source, candidate);
    } catch (error) {
      failures.push(`${candidate}: ${error instanceof Error ? error.message : "fetch failed"}`);
    }
  }
  const run = await recordBlockedRun(source, "failed", `No accessible official public file was downloaded. ${failures.join(" | ") || "No candidates discovered."}`);
  throw new Error(run.message ?? "Official source unavailable.");
}

async function discoverVisibleFileLinks(source, pageUrl) {
  enforceOfficialUrlPolicy(source, pageUrl);
  const response = await fetch(pageUrl, { headers: requestHeaders(pageUrl), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Discovery HTTP ${response.status}`);
  const html = await response.text();
  const $ = loadHtml(html);
  const links = [];
  $("a[href]").each((_, element) => {
    const href = String($(element).attr("href") ?? "");
    const text = String($(element).text() ?? "");
    if (!/\.(xlsx?|csv|json|pdf)(?:$|[?#])|price|drug|medicine|pharmaceutical/i.test(`${href} ${text}`)) return;
    try {
      links.push(new URL(href, pageUrl).toString());
    } catch {
      // Ignore malformed visible links.
    }
  });
  return [...new Set(links)];
}

async function fetchOfficialFile(source, url) {
  enforceOfficialUrlPolicy(source, url);
  const response = await fetch(url, { redirect: "follow", headers: requestHeaders(url), signal: AbortSignal.timeout(45000) });
  const finalUrl = response.url || url;
  enforceOfficialUrlPolicy(source, finalUrl);
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (looksLikeHtmlBlock(buffer, contentType)) throw new Error(`official server returned HTML instead of a source file (${contentType || "unknown content type"})`);
  mkdirSync(storageRoot, { recursive: true });
  const extension = extensionFromUrlOrType(finalUrl, contentType);
  const fileSha256 = sha256Buffer(buffer);
  const safeCode = source.code.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const fileName = `${safeCode}-${new Date().toISOString().slice(0, 10)}-${fileSha256.slice(0, 12)}${extension}`;
  const filePath = join(storageRoot, fileName);
  writeFileSync(filePath, buffer);
  return {
    kind: "file",
    sourceUrl: url,
    finalUrl,
    contentType,
    lastModified: response.headers.get("last-modified"),
    fetchedAt: new Date(),
    buffer,
    fileName,
    filePath,
    fileSha256
  };
}

function parseDownloadedSource(downloaded, source) {
  if (downloaded.kind === "rows") {
    return { fileName: downloaded.fileName, fileSha256: downloaded.fileSha256, rows: downloaded.rows, parserName: source.importerKey ?? "official-public-list" };
  }
  const extension = extname(downloaded.fileName || new URL(downloaded.finalUrl).pathname).toLowerCase();
  if ([".xlsx", ".xls"].includes(extension) || /spreadsheet|excel/i.test(downloaded.contentType ?? "")) {
    return { fileName: downloaded.fileName, fileSha256: downloaded.fileSha256, rows: parseXlsxRows(downloaded.buffer), parserName: source.importerKey ?? "generic-official-xlsx" };
  }
  if (extension === ".csv" || /csv/i.test(downloaded.contentType ?? "")) {
    return { fileName: downloaded.fileName, fileSha256: downloaded.fileSha256, rows: parseCsv(downloaded.buffer.toString("utf8")), parserName: "generic-official-csv" };
  }
  if (extension === ".json" || /json/i.test(downloaded.contentType ?? "")) {
    const parsed = JSON.parse(downloaded.buffer.toString("utf8"));
    return { fileName: downloaded.fileName, fileSha256: downloaded.fileSha256, rows: Array.isArray(parsed) ? parsed : parsed.rows ?? [], parserName: "generic-official-json" };
  }
  if (extension === ".pdf" || /pdf/i.test(downloaded.contentType ?? "")) {
    return { fileName: downloaded.fileName, fileSha256: downloaded.fileSha256, rows: parsePdfLikeText(downloaded.buffer.toString("latin1")), parserName: source.importerKey ?? "generic-official-pdf-text" };
  }
  throw new Error(`Unsupported official file type from ${downloaded.finalUrl}`);
}

function parseXlsxRows(buffer) {
  const workbook = read(buffer, { type: "buffer", cellDates: false });
  const rows = [];
  for (const sheetName of workbook.SheetNames) {
    const sheetRows = xlsxUtils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
    const headerIndex = sheetRows.findIndex((row) => row.filter((cell) => String(cell).trim()).length >= 3 && row.some((cell) => /(drug|medicine|product|trade|registration|price|strength)/i.test(String(cell))));
    if (headerIndex < 0) continue;
    const headers = sheetRows[headerIndex].map((cell, index) => String(cell || `column_${index + 1}`).trim() || `column_${index + 1}`);
    for (const row of sheetRows.slice(headerIndex + 1)) {
      const values = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
      if (Object.values(values).some((value) => String(value).trim())) rows.push({ ...values, __sheetName: sheetName });
    }
  }
  return rows;
}

function parsePdfLikeText(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({ lineText: line, Price: line.match(/\b\d+(?:\.\d{1,3})?\b/)?.[0] ?? "" }));
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"" && line[index + 1] === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else current += char;
  }
  values.push(current);
  return values;
}

export async function getSource(country, sourceCode) {
  const countryCode = String(country ?? "").toUpperCase();
  const code = sourceCode ?? countrySourceDefaults[countryCode];
  if (!code) throw new Error("Country or source is required.");
  const source = await prisma.drugMarketSource.findUnique({ where: { code } });
  if (!source) throw new Error(`Source not found: ${code}`);
  return source;
}

export function isSourceGated(source) {
  return ["approved_api_required", "gated_manual_required", "unavailable"].includes(source.sourceAccessMode);
}

export async function recordBlockedRun(source, status, message) {
  const now = new Date();
  const run = await prisma.drugMarketImportRun.create({
    data: {
      sourceId: source.id,
      status,
      dryRun: true,
      message,
      rowCount: 0,
      totalRowsSeen: 0,
      rowsSkipped: 0,
      rowsFailed: 0,
      sourceUrl: source.officialUrl ?? source.websiteUrl,
      sourceFetchedAt: now,
      parserName: source.importerKey ?? "official-source-policy",
      parserVersion: "v0.8",
      finishedAt: now,
      coverageJson: { sourceCode: source.code, countryCode: source.countryCode, reason: message }
    }
  });
  await prisma.drugMarketSource.update({
    where: { id: source.id },
    data: {
      lastCheckedAt: now,
      sourceFreshnessStatus: status === "failed" ? "failed" : (source.sourceAccessMode === "approved_api_required" ? "gated" : "manual_required"),
      coverageStatus: status === "failed" ? "failed" : (source.sourceAccessMode === "approved_api_required" ? "blocked_requires_api_approval" : "blocked_requires_official_file"),
      notes: `${source.notes ?? ""}\n${message}`.trim()
    }
  });
  return run;
}

export function normalizeOfficialRow(row, countryCode) {
  const normalizedCountryCode = String(pick(row, ["countryCode", "Country", "Country Code"]) || countryCode || "").toUpperCase();
  const tradeName = pick(row, ["tradeName", "Trade Name", "Product Name", "Medicine Name", "MEDICINE NAME", "Name", "Brand Name", "DRUG NAME"]);
  const genericName = pick(row, ["genericName", "Generic Name", "Scientific Name", "Active Ingredient", "ACTIVE SUBSTANCES", "Ingredient"]);
  const strengthValue = pick(row, ["STRENGTH", "Strength"]);
  const strengthUnit = pick(row, ["UNIT OF STRENGTH", "Strength Unit"]);
  const strengthText = pick(row, ["strengthText", "Strength Text", "Strength + Strength Unit"]) || [strengthValue, strengthUnit].filter(Boolean).join(" ").trim() || null;
  const dosageForm = pick(row, ["dosageForm", "Dosage Form", "PHARMACEUTICAL FORM", "Pharmaceutical Form", "Form"]);
  const route = pick(row, ["route", "Route", "ROUTE OF ADMINISTRATION", "Route of Administration"]);
  const packageText = pick(row, ["packageText", "Package", "Pack", "PACK SIZE", "Pack Size", "Package Size"]);
  const registrationNumber = pick(row, ["registrationNumber", "Registration Number", "DRUG REGISTRATION NUMBER", "Register Number", "DRN", "Reg No"]);
  const priceText = pick(row, ["officialPriceText", "priceText", "Price", "RETAIL PRICE", "Public Price", "Selling Price", "Public Price (KWD)"]);
  return {
    tradeName,
    genericName,
    countryCode: normalizedCountryCode,
    strengthText,
    dosageForm,
    route,
    packageText,
    registrationNumber,
    manufacturer: pick(row, ["manufacturer", "Manufacturer", "Company", "Manufacturer/Company", "BATCH RELEASING SITE NAME"]),
    marketingCompany: pick(row, ["marketingCompany", "Marketing Company", "MAH", "MAH NAME", "Agent", "AGENT NAME", "Applicant"]),
    legalStatus: pick(row, ["legalStatus", "Legal Status", "METHOD OF SALE/SUPPLY"]),
    authorizationStatus: pick(row, ["authorizationStatus", "Authorization Status", "Status"]),
    atcCode: pick(row, ["atcCode", "ATC Code", "ATC Code1", "ATC Code2"]),
    officialPriceText: priceText,
    officialPriceAmount: parseAmount(priceText),
    currency: pick(row, ["currency", "Currency"]) || countryCurrency[normalizedCountryCode] || null,
    parserConfidence: confidence({ tradeName, genericName, strengthText, dosageForm, packageText, registrationNumber, priceText }),
    raw: row
  };
}

async function importParsedOfficialRows({ source, countryCode, mode, parsed, snapshot }) {
  const now = snapshot.fetchedAt ?? new Date();
  const run = await prisma.drugMarketImportRun.create({
    data: {
      sourceId: source.id,
      status: "running",
      dryRun: mode === "dry-run",
      sourceUrl: snapshot.finalUrl ?? snapshot.sourceUrl,
      sourceFileName: parsed.fileName,
      sourceFileSha256: parsed.fileSha256,
      sourceFetchedAt: now,
      sourceLastModifiedHeader: snapshot.lastModified ?? null,
      parserName: parserForSource(source, parsed.parserName),
      parserVersion: "v0.8.1",
      rowCount: parsed.rows.length,
      totalRowsSeen: parsed.rows.length,
      sourceSnapshotJson: { sourceCode: source.code, sourceUrl: snapshot.sourceUrl, finalUrl: snapshot.finalUrl, contentType: snapshot.contentType, fileName: parsed.fileName },
      coverageJson: { countryCode, sourceCode: source.code }
    }
  });

  let rowsImported = 0;
  let rowsNeedsReview = 0;
  let rowsSkipped = 0;
  let rowsFailed = 0;
  let confidenceTotal = 0;
  const touchedProductIds = new Set();

  if (mode !== "dry-run") {
    for (const [index, rawRow] of parsed.rows.entries()) {
      try {
        const row = normalizeOfficialRow(rawRow, countryCode);
        if (!row.tradeName && !row.genericName) {
          rowsSkipped += 1;
          if (row.parserConfidence < 0.55) await createReviewWarning(source.id, parsed.fileName, index + 1, "Official row lacked trade and generic name.", rawRow, row);
          continue;
        }
        const product = await upsertProduct(row, now);
        const variant = await upsertVariant(product.id, row, run.id, source.id, now);
        touchedProductIds.add(product.id);
        if (variant.verificationStatus !== "verified") rowsNeedsReview += 1;
        if (row.parserConfidence < 0.65) {
          await prisma.drugMarketManualReviewQueue.create({
            data: { queueType: "low_confidence_official_row", productId: product.id, variantId: variant.id, reason: "Official medication row imported with low parser confidence. Manual review required." }
          });
        }
        rowsImported += 1;
        confidenceTotal += row.parserConfidence;
      } catch (error) {
        rowsFailed += 1;
        await createReviewWarning(source.id, parsed.fileName, index + 1, error instanceof Error ? error.message : "Row import failed.", rawRow, { parserConfidence: 0.2 });
      }
    }
    for (const productId of touchedProductIds) await recomputeProductAvailability(productId);
  }

  await prisma.officialMedicationSourceSnapshot.create({
    data: {
      sourceId: source.id,
      countryCode: source.countryCode ?? countryCode,
      sourceName: source.name,
      sourceUrl: snapshot.finalUrl ?? snapshot.sourceUrl,
      sourceType: source.sourceType,
      fetchedAt: now,
      lastModifiedHeader: snapshot.lastModified ?? null,
      fileName: parsed.fileName,
      fileSha256: parsed.fileSha256,
      rowCount: parsed.rows.length,
      importRunId: run.id,
      status: rowsFailed ? "needs_review" : "captured",
      metadataJson: { parserName: parserForSource(source, parsed.parserName), dryRun: mode === "dry-run", contentType: snapshot.contentType }
    }
  });

  const status = rowsFailed ? "needs_review" : "imported";
  await prisma.drugMarketImportRun.update({
    where: { id: run.id },
    data: {
      status,
      message: mode === "dry-run" ? "Dry run completed; no rows written." : "Official source import completed. Rows require review before verification.",
      rowsImported,
      rowsNeedsReview,
      rowsSkipped,
      rowsFailed,
      parserConfidence: rowsImported ? confidenceTotal / rowsImported : null,
      finishedAt: new Date()
    }
  });
  await prisma.drugMarketSource.update({
    where: { id: source.id },
    data: {
      lastCheckedAt: now,
      lastSuccessfulImportAt: rowsImported ? now : source.lastSuccessfulImportAt,
      sourceFreshnessStatus: rowsImported || parsed.rows.length ? "current_checked_today" : "failed",
      coverageStatus: rowsImported ? (rowsNeedsReview ? "needs_review" : "imported") : (parsed.rows.length ? "needs_review" : "failed"),
      latestSourceLabel: parsed.fileName
    }
  });

  return { source: source.code, status, rowsImported, rowsSeen: parsed.rows.length, rowsNeedsReview, rowsSkipped, rowsFailed, fileSha256: parsed.fileSha256, sourceUrl: snapshot.finalUrl ?? snapshot.sourceUrl };
}

async function recomputeProductAvailability(productId) {
  const variants = await prisma.drugMarketVariant.groupBy({
    by: ["countryCode"],
    where: { productId, verificationStatus: { not: "retired" }, isDemo: false },
    _count: { _all: true }
  });
  const hasEgypt = variants.some((item) => item.countryCode === "EG");
  for (const item of variants) {
    const country = await prisma.drugMarketCountry.findUnique({ where: { countryCode: item.countryCode } });
    const showCompactBadge = !hasEgypt && country?.showCompactBadgeByDefault === true;
    await prisma.drugMarketAvailability.upsert({
      where: { productId_countryCode: { productId, countryCode: item.countryCode } },
      update: {
        variantCount: item._count._all,
        compactBadgeLabel: showCompactBadge ? country?.compactBadgeLabel : null,
        showCompactBadge
      },
      create: {
        productId,
        countryCode: item.countryCode,
        variantCount: item._count._all,
        compactBadgeLabel: showCompactBadge ? country?.compactBadgeLabel : null,
        showCompactBadge
      }
    });
  }
}

function parserForSource(source, fallback) {
  return source.importerKey || fallback || "generic-official-file";
}

function searchText(row) {
  return [row.tradeName, row.genericName, row.strengthText, row.dosageForm, row.route, row.packageText, row.registrationNumber, row.atcCode, row.manufacturer, row.marketingCompany].filter(Boolean).join(" ").toLowerCase();
}

async function upsertProduct(row, fetchedAt) {
  const tradeName = row.tradeName || row.genericName;
  const existing = await prisma.drugMarketProduct.findFirst({ where: { tradeName, genericName: row.genericName, isDemo: false } });
  const data = {
    tradeName,
    genericName: row.genericName,
    normalizedSearchText: searchText(row),
    manufacturer: row.manufacturer,
    marketingCompany: row.marketingCompany,
    verificationStatus: "needs_review",
    isDemo: false,
    dataCompletenessScore: row.parserConfidence,
    latestSourceFetchedAt: fetchedAt
  };
  return existing ? prisma.drugMarketProduct.update({ where: { id: existing.id }, data }) : prisma.drugMarketProduct.create({ data });
}

async function upsertVariant(productId, row, importRunId, sourceId, fetchedAt) {
  const sourceRowHash = rowHash(row.raw, row.countryCode);
  const existing = await prisma.drugMarketVariant.findUnique({ where: { countryCode_sourceRowHash: { countryCode: row.countryCode, sourceRowHash } } });
  if (existing?.verificationStatus === "verified") {
    await prisma.drugMarketManualReviewQueue.create({
      data: { queueType: "verified_row_conflict", productId, variantId: existing.id, reason: "Verified official medication row matched a new import. Manual review required." }
    });
    return existing;
  }
  const data = {
    productId,
    sourceId,
    countryCode: row.countryCode,
    tradeName: row.tradeName || row.genericName,
    genericName: row.genericName,
    strengthText: row.strengthText,
    dosageForm: row.dosageForm,
    route: row.route,
    packageText: row.packageText,
    manufacturer: row.manufacturer,
    marketingCompany: row.marketingCompany,
    registrationNumber: row.registrationNumber,
    legalStatus: row.legalStatus,
    authorizationStatus: row.authorizationStatus,
    atcCode: row.atcCode,
    priceText: row.officialPriceText,
    officialPriceText: row.officialPriceText,
    officialPriceAmount: row.officialPriceAmount,
    currency: row.currency,
    priceSourceId: sourceId,
    sourceFetchedAt: fetchedAt,
    importRunId,
    parserConfidence: row.parserConfidence,
    officialRowJson: row.raw,
    sourceRowHash,
    verificationStatus: "needs_review",
    isDemo: false
  };
  return existing ? prisma.drugMarketVariant.update({ where: { id: existing.id }, data }) : prisma.drugMarketVariant.create({ data });
}

let legacyJobId = null;
async function createReviewWarning(sourceId, fileName, rowNumber, message, rawRow, row) {
  if (!legacyJobId) {
    const job = await prisma.drugMarketImportJob.create({
      data: { sourceId, status: "needs_review", fileName, rowCount: 0, summaryText: "Official medication import row warnings." }
    });
    legacyJobId = job.id;
  }
  return prisma.drugMarketImportRowError.create({
    data: {
      jobId: legacyJobId,
      severity: "warning",
      rowNumber,
      message,
      rawRowJson: rawRow,
      parserName: "official-source-importer",
      parserConfidence: row.parserConfidence ?? 0.2,
      suggestedAction: "Review official row mapping."
    }
  });
}

function enforceOfficialUrlPolicy(source, rawUrl) {
  if (!rawUrl) throw new Error("Missing official source URL.");
  const url = new URL(rawUrl);
  if (blockedUrlPattern.test(url.toString())) throw new Error(`Blocked protected or retail URL: ${rawUrl}`);
  const domains = officialDomainsBySource[source.code] ?? [];
  if (domains.length && !domains.includes(url.hostname.toLowerCase())) throw new Error(`URL is not on the configured official domain for ${source.code}: ${url.hostname}`);
}

function requestHeaders(url) {
  return {
    "user-agent": "PrijClinicOfficialMedicationImporter/0.8.1 (+local-admin; no patient data)",
    "accept": url.toLowerCase().includes(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*" : "*/*"
  };
}

function extensionFromUrlOrType(url, contentType) {
  const pathExt = extname(new URL(url).pathname).toLowerCase();
  if (pathExt) return pathExt;
  if (/spreadsheet|excel/i.test(contentType)) return ".xlsx";
  if (/pdf/i.test(contentType)) return ".pdf";
  if (/csv/i.test(contentType)) return ".csv";
  if (/json/i.test(contentType)) return ".json";
  return ".bin";
}

function looksLikeHtmlBlock(buffer, contentType) {
  const head = buffer.toString("utf8", 0, Math.min(buffer.length, 256)).trim().toLowerCase();
  return /html/i.test(contentType) || head.startsWith("<!doctype html") || head.startsWith("<html");
}

async function fetchSfdaPublicRows(source, options) {
  const run = await recordBlockedRun(source, "failed", `SFDA public list downloader is conservative in v0.8.1 and did not find a stable direct public data endpoint. maxPages=${options.maxPages ?? "default"}. No bypass attempted.`);
  throw new Error(run.message ?? "SFDA source unavailable.");
}

function pick(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
}

function parseAmount(value) {
  if (!value) return null;
  const match = String(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? match[0] : null;
}

function confidence(fields) {
  const present = Object.values(fields).filter((value) => String(value ?? "").trim()).length;
  return Math.min(0.99, 0.35 + present * 0.08);
}
