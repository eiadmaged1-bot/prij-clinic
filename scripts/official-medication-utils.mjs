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
  OMN: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
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
    "https://www.moph.gov.qa/english/departments/policyaffairs/pdc/regnpricing/Pages/default.aspx",
    "https://www.moph.gov.qa/english/departments/policyaffairs/pdc/Pages/default.aspx",
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
  ],
  OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES: [
    "https://www.moh.gov.om/en/hospitals-directorates/directorates-and-centers-at-hq/drug-safety-center/"
  ],
  OMAN_MOH_SUPP_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES: [
    "https://www.moh.gov.om/en/hospitals-directorates/directorates-and-centers-at-hq/drug-safety-center/"
  ]
};

const officialDomainsBySource = {
  QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES: ["moph.gov.qa", "www.moph.gov.qa"],
  BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST: ["nhra.bh", "www.nhra.bh"],
  BAHRAIN_NHRA_LICENSED_MEDICINES_OPEN_DATA: ["nhra.bh", "www.nhra.bh"],
  KUWAIT_MOH_DRUG_PRICE_LIST: ["moh.gov.kw", "www.moh.gov.kw"],
  KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST: ["moh.gov.kw", "www.moh.gov.kw"],
  OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES: ["moh.gov.om", "www.moh.gov.om"],
  OMAN_MOH_SUPP_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES: ["moh.gov.om", "www.moh.gov.om"],
  OMAN_MOH_DRUG_SAFETY_CENTER: ["moh.gov.om", "www.moh.gov.om"],
  OMAN_OFFICIAL_FILE_UPLOAD: ["moh.gov.om", "www.moh.gov.om"],
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

export async function parseOfficialFile(filePath, sourceCode = "") {
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
    return { fileName: basename(absolute), fileSha256: sha256Buffer(buffer), rows: parsePdfLikeText(await extractPdfText(buffer), sourceCode), parserName: "generic-official-pdf-text" };
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
    parsed = await parseOfficialFile(file, source.code);
    snapshot = { sourceUrl: source.officialUrl ?? source.websiteUrl, finalUrl: source.officialUrl ?? source.websiteUrl, fetchedAt: new Date(), filePath: resolve(file) };
  } else {
    const downloaded = await discoverAndFetchOfficialSource(source, { maxPages });
    parsed = await parseDownloadedSource(downloaded, source);
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
  return discoverVisibleFileLinksFromHtml(source, pageUrl, html).map((item) => item.url);
}

function discoverVisibleFileLinksFromHtml(source, pageUrl, html) {
  const $ = loadHtml(html);
  const links = [];
  $("a[href]").each((_, element) => {
    const href = String($(element).attr("href") ?? "");
    const text = String($(element).text() ?? "");
    const combined = `${href} ${text}`;
    if (!isRelevantOfficialFileLink(source.code, combined)) return;
    try {
      links.push({ url: new URL(href, pageUrl).toString(), label: text.trim() || href });
    } catch {
      // Ignore malformed visible links.
    }
  });
  $("[data-fileUrl], [data-fileurl], [data-file-url]").each((_, element) => {
    const href = String($(element).attr("data-fileUrl") ?? $(element).attr("data-fileurl") ?? $(element).attr("data-file-url") ?? "");
    const label = String($(element).attr("data-fileName") ?? $(element).attr("data-filename") ?? $(element).text() ?? "");
    const combined = `${href} ${label}`;
    if (!href || !isRelevantOfficialFileLink(source.code, combined)) return;
    try {
      links.push({ url: new URL(href, pageUrl).toString(), label: label.trim() || href });
    } catch {
      // Ignore malformed visible file selectors.
    }
  });
  const seen = new Set();
  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

async function fetchOfficialFile(source, url, htmlDepth = 0, sourceLabel = null) {
  enforceOfficialUrlPolicy(source, url);
  const response = await fetch(url, { redirect: "follow", headers: requestHeaders(url), signal: AbortSignal.timeout(45000) });
  const finalUrl = response.url || url;
  enforceOfficialUrlPolicy(source, finalUrl);
  const contentType = response.headers.get("content-type") ?? "";
  const contentDisposition = response.headers.get("content-disposition") ?? "";
  if (!response.ok) throw new Error(`HTTP ${response.status}; finalUrl=${finalUrl}; contentType=${contentType || "unknown"}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (looksLikeHtmlBlock(buffer, contentType)) {
    if (htmlDepth >= 1) throw new Error(`official server returned HTML instead of a source file (${contentType || "unknown content type"}); finalUrl=${finalUrl}`);
    const html = buffer.toString("utf8");
    const discovered = discoverVisibleFileLinksFromHtml(source, finalUrl, html);
    const next = discovered.find((link) => isPreferredSourceLink(source.code, link.label, link.url)) ?? discovered[0];
    if (!next) throw new Error(`official HTML page did not expose a supported source file link (${contentType || "unknown content type"}); finalUrl=${finalUrl}; visibleCandidateLinks=${discovered.length}`);
    return fetchOfficialFile(source, next.url, htmlDepth + 1, next.label);
  }
  mkdirSync(storageRoot, { recursive: true });
  const extension = extensionFromUrlOrType(finalUrl, contentType, contentDisposition, buffer);
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
    contentDisposition,
    lastModified: response.headers.get("last-modified"),
    fetchedAt: new Date(),
    sourceLabel,
    buffer,
    fileName,
    filePath,
    fileSha256
  };
}

async function parseDownloadedSource(downloaded, source) {
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
    const text = await extractPdfText(downloaded.buffer);
    return { fileName: downloaded.fileName, fileSha256: downloaded.fileSha256, rows: parsePdfLikeText(text, source.code), parserName: source.importerKey ?? "generic-official-pdf-text" };
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

function parsePdfLikeText(text, sourceCode = "") {
  if (sourceCode.startsWith("OMAN_MOH_")) return parseOmanPricePdfTextV2(text);
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const price = line.match(/\b\d+(?:\.\d{1,3})?\b/g)?.at(-1) ?? "";
    const words = line.replace(/\s+/g, " ").trim();
    return {
      lineText: words,
      "Product Name": words.replace(/\b\d+(?:\.\d{1,3})?\b/g, "").trim(),
      Price: price
    };
  });
}

function parseOmanPricePdfText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const rows = [];
  let current = null;
  for (const line of lines) {
    if (/^(regn\.|رقم التسجيل|for search press|--\s*\d+\s+of\s+\d+\s*--)/i.test(line)) continue;
    const startsRow = /^(?:[A-Z]\d{4,}[A-Z]?|\d{4,}[A-Z]?|1R|V)\s+/.test(line);
    if (startsRow) {
      if (current) rows.push(current);
      const [registrationNumber, ...rest] = line.split(" ");
      current = { registrationNumber, block: [line], firstText: rest.join(" ") };
    } else if (current) {
      current.block.push(line);
    }
  }
  if (current) rows.push(current);
  return rows.map((row) => {
    const blockText = row.block.join(" ");
    const prices = [...blockText.matchAll(/\b\d+(?:\.\d{1,3})\b/g)].map((match) => match[0]);
    const price = prices.at(-1) ?? "";
    const withoutPrice = price ? blockText.replace(new RegExp(`\\s${price.replace(".", "\\.")}$`), "") : blockText;
    const productText = row.firstText || withoutPrice.replace(row.registrationNumber, "").trim();
    return {
      registrationNumber: row.registrationNumber,
      "Product Name": productText,
      "Trade Name": productText,
      Price: price,
      currency: "OMR",
      lineText: blockText,
      rawBlockText: blockText
    };
  }).filter((row) => row["Product Name"] && row.Price);
}

function parseOmanPricePdfTextV2(text) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const rows = [];
  let current = null;
  for (const line of lines) {
    if (isOmanNoiseLine(line)) continue;
    const registrationNumber = omanRegistrationToken(line);
    if (registrationNumber) {
      if (current) rows.push(current);
      current = { registrationNumber, block: [line] };
    } else if (current) {
      current.block.push(line);
    }
    if (current && isOmanPriceLine(line)) {
      rows.push(current);
      current = null;
    }
  }
  if (current) rows.push(current);
  const structuredRows = rows.map(omanStructuredRowFromBlock).filter((row) => row["Product Name"] && row.Price);
  const legacyRows = parseOmanPricePdfText(text).map(enrichOmanLegacyRow).filter((row) => row["Product Name"] && row.Price);
  return structuredRows.length >= legacyRows.length ? structuredRows : legacyRows;
}

function enrichOmanLegacyRow(row) {
  const rawBlockText = row.rawBlockText || row.lineText || "";
  const registrationNumber = row.registrationNumber;
  const sourceRowHashRaw = {
    registrationNumber: row.registrationNumber,
    "Product Name": row["Product Name"],
    "Trade Name": row["Trade Name"],
    Price: row.Price,
    currency: row.currency,
    lineText: row.lineText,
    rawBlockText: row.rawBlockText
  };
  const withoutRegistration = cleanOmanText(rawBlockText.replace(new RegExp(`^${escapeRegExp(registrationNumber)}\\s+`, "i"), ""));
  const segment = cleanOmanText(withoutRegistration.split(/\s(?=(?:[A-Z]?\d{4,}[A-Z]?|\d+[A-Z]|1R|V)\s+)/i)[0] || withoutRegistration);
  const prices = [...segment.matchAll(/\b\d+(?:\.\d{1,3})\b/g)].map((match) => match[0]);
  const price = prices.at(-1) || row.Price || "";
  const block = [`${registrationNumber} ${segment}`];
  if (price && !isOmanPriceLine(segment)) block.push(price);
  const structured = omanStructuredRowFromBlock({ registrationNumber, block });
  return {
    ...row,
    ...structured,
    Price: price,
    currency: price ? "OMR" : row.currency,
    lineText: rawBlockText,
    rawBlockText,
    __sourceRowHashRaw: sourceRowHashRaw
  };
}

function isOmanNoiseLine(line) {
  return /^(regn\.|for search press|--\s*\d+\s+of\s+\d+\s*--)/i.test(line)
    || /^(رقم التسجيل|االسم التجاري|حجم العبوة|المادة الفعالة|الوكيل|اسم المصنع|السعر)$/i.test(line);
}

function omanRegistrationToken(line) {
  const match = line.match(/^((?:[A-Z]?\d{4,}[A-Z]?|\d+[A-Z]|1R|V))\s+(.+)$/i);
  if (!match) return null;
  if (/^(?:ML|MG|GM|MCG|IU|TAB|CAP|VIAL|AMPOULE|BOTTLE|SACHET|TUBE|DOSE)$/i.test(match[1])) return null;
  return match[1].toUpperCase();
}

function isOmanPriceLine(line) {
  return /^\d+(?:\.\d{1,3})$/.test(line);
}

function omanStructuredRowFromBlock(row) {
  const rawBlockText = row.block.join(" ");
  const price = row.block.findLast((line) => isOmanPriceLine(line)) ?? "";
  const contentLines = row.block.slice();
  if (contentLines.length && isOmanPriceLine(contentLines.at(-1))) contentLines.pop();
  if (!contentLines.length) return {};
  contentLines[0] = contentLines[0].replace(new RegExp(`^${escapeRegExp(row.registrationNumber)}\\s+`, "i"), "").trim();
  if (contentLines.length === 1 && contentLines[0].length > 60) {
    const split = splitOmanOneLineProduct(contentLines[0], price);
    return omanStructuredRowFromParts(row, split.tradeText, split.remainingText, price);
  }
  const tradeParts = [];
  while (contentLines.length) {
    const next = contentLines[0];
    tradeParts.push(next);
    contentLines.shift();
    if (tradeParts.length >= 4 || hasDosageFormText(next) || hasPackText(next) || hasStrengthText(next)) break;
    if (contentLines[0] && hasPackText(contentLines[0])) break;
  }
  const tradeText = cleanOmanText(tradeParts.join(" "));
  const remainingText = cleanOmanText(contentLines.join(" "));
  return omanStructuredRowFromParts(row, tradeText, remainingText, price);
}

function omanStructuredRowFromParts(row, tradeText, remainingText, price) {
  const rawBlockText = row.block.join(" ");
  const allProductText = cleanOmanText(`${tradeText} ${remainingText}`);
  const dosageForm = extractDosageForm(allProductText);
  const strengthText = extractStrength(allProductText);
  const packageText = extractPack(allProductText);
  const genericName = extractOmanActiveText(remainingText, packageText);
  const company = extractOmanCompany(remainingText);
  return {
    registrationNumber: row.registrationNumber,
    "Product Name": tradeText,
    "Trade Name": tradeText,
    "Generic Name": genericName,
    "Strength Text": strengthText,
    "Dosage Form": dosageForm,
    Package: packageText,
    Manufacturer: company.manufacturer,
    "Marketing Company": company.agent,
    Price: price,
    currency: price ? "OMR" : "",
    lineText: rawBlockText,
    rawBlockText,
    parsedBlockLines: row.block
  };
}

function splitOmanOneLineProduct(line, price) {
  let text = cleanOmanText(line);
  if (price) text = cleanOmanText(text.replace(new RegExp(`\\s${escapeRegExp(price)}$`), ""));
  const packMatch = matchPackWithIndex(text);
  if (!packMatch) {
    return { tradeText: text, remainingText: "" };
  }
  const tradeText = cleanOmanText(text.slice(0, packMatch.index));
  const remainingText = cleanOmanText(text.slice(packMatch.index));
  return { tradeText, remainingText };
}

function matchPackWithIndex(value) {
  const patterns = [
    /\b\d+\s*x\s*\d+\s*(?:tab|tabs|cap|caps|vial|vials|ampoule|ampoules|sachet|sachets|bottle|bottles)\b/i,
    /\b\d+\s*x\s*\d+\s*(?:ml|gm|g)\b/i,
    /\b\d+\s*(?:dose|doses|vial|vials|ampoule|ampoules|bottle|bottles|sachet|sachets|tube|tubes)\b/i,
    /\b\d+['’]s\b/i
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return { text: cleanOmanText(match[0]), index: match.index ?? 0 };
  }
  return null;
}

function cleanOmanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").replace(/\s+([),])/g, "$1").replace(/[(]\s+/g, "(").trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasDosageFormText(value) {
  return /\b(tablets?|tabs?|capsules?|caps?|syrup|suspension|solution|vials?|ampoules?|injection|infusion|drops?|cream|ointment|gel|suppositor(?:y|ies)|pessar(?:y|ies)|vaginal tablet|inhaler|spray|patch|sachets?|powder)\b/i.test(value);
}

function hasPackText(value) {
  return /\b\d+\s*x\s*\d+|\b\d+['’]?s\b|\b\d+\s*(?:ml|gm|g|vial|ampoule|tab|cap|dose|bottle|sachet|tube)s?\b/i.test(value);
}

function hasStrengthText(value) {
  return /\b\d+(?:\.\d+)?\s*(?:mg|g|gm|mcg|microgram|iu|units?|mg\/ml|mg\/\s*\d+\s*ml|mg\/5ml|%|w\/v|mcg\/ml|mmol\/l)\b|(?:\d+(?:\.\d+)?\s*\/\s*)+\d+(?:\.\d+)?\s*(?:mg|ml|mcg|iu)\b/i.test(value);
}

function extractDosageForm(value) {
  const forms = [
    ["vaginal tablet", /\bvaginal\s+tablets?\b/i],
    ["tablet", /\b(?:tablets?|tabs?)\b/i],
    ["capsule", /\b(?:capsules?|caps?)\b/i],
    ["syrup", /\bsyrup\b/i],
    ["suspension", /\bsuspension\b/i],
    ["solution", /\bsolution\b/i],
    ["vial", /\bvials?\b/i],
    ["ampoule", /\bampoules?\b/i],
    ["injection", /\binjection\b/i],
    ["drops", /\bdrops?\b/i],
    ["cream", /\bcream\b/i],
    ["ointment", /\bointment\b/i],
    ["gel", /\bgel\b/i],
    ["suppository", /\bsuppositor(?:y|ies)\b/i],
    ["pessary", /\bpessar(?:y|ies)\b/i],
    ["inhaler", /\binhaler\b/i],
    ["spray", /\bspray\b/i],
    ["patch", /\bpatch\b/i],
    ["sachet", /\bsachets?\b/i],
    ["powder", /\bpowder\b/i],
    ["infusion", /\binfusion\b/i]
  ];
  return forms.find(([, pattern]) => pattern.test(value))?.[0] ?? null;
}

function extractStrength(value) {
  const matches = [...String(value).matchAll(/\b(?:\d+(?:\.\d+)?\s*\/\s*)*\d+(?:\.\d+)?\s*(?:mg\/\s*\d+\s*ml|mg\/ml|mg\/5ml|mcg\/ml|mg|mcg|microgram|g|gm|iu|units?|%|w\/v|mmol\/l)\b/gi)]
    .map((match) => cleanOmanText(match[0].replace(/\s*\/\s*/g, "/")));
  return [...new Set(matches)].slice(0, 3).join(" + ") || null;
}

function extractPack(value) {
  return matchPackWithIndex(value)?.text ?? null;
}

function extractOmanActiveText(remainingText, packageText) {
  let text = remainingText;
  if (packageText) text = text.replace(packageText, " ");
  const stop = text.search(/\b(?:Muscat|Ebin|Ibn|Al\s+[A-Z]|Scientific|Capital|Waleed|Mazoon|Modern|National|Oman|Salalah|Ruwi|Nizwa)\b.*\b(?:Pharmacy|Stores|L\.L\.C|LLC)\b/i);
  if (stop >= 0) text = text.slice(0, stop);
  text = cleanOmanText(text);
  if (!text || text.length > 160) return null;
  return text;
}

function extractOmanCompany(remainingText) {
  const agentMatch = remainingText.match(/\b((?:Muscat|Ebin Rushed|Ibn Sina|Al [A-Z][A-Za-z]+|Scientific|Capital|Waleed|Mazoon|Modern|National|Oman|Salalah|Ruwi|Nizwa)[A-Za-z &.]*?(?:Pharmacy|Stores)(?:\s*&\s*Stores)?(?:\s*L\.L\.C)?)\b/i);
  const agent = agentMatch ? cleanOmanText(agentMatch[1]) : null;
  let manufacturer = null;
  if (agentMatch) {
    manufacturer = cleanOmanText(remainingText.slice(agentMatch.index + agentMatch[0].length));
    manufacturer = manufacturer.replace(/\b\d+(?:\.\d{1,3})?\b$/, "").trim() || null;
    if (manufacturer && manufacturer.length > 120) manufacturer = null;
  }
  return { agent, manufacturer };
}

async function extractPdfText(buffer) {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text || buffer.toString("latin1");
  } catch {
    return buffer.toString("latin1");
  }
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
  const { __sourceRowHashRaw, ...officialRaw } = row;
  const normalizedCountryCode = String(pick(row, ["countryCode", "Country", "Country Code"]) || countryCode || "").toUpperCase();
  const tradeName = pick(row, ["tradeName", "commercial_name_en", "Trade Name", "Product Name", "Medicine Name", "MEDICINE NAME", "Name", "Brand Name", "DRUG NAME"]);
  const tradeNameArabic = pick(row, ["tradeNameArabic", "commercial_name_ar", "Arabic Trade Name"]);
  const genericName = pick(row, ["genericName", "scientific_name", "Generic Name", "Scientific Name", "Active Ingredient", "ACTIVE SUBSTANCES", "Ingredient"]);
  const strengthValue = pick(row, ["STRENGTH", "Strength"]);
  const strengthUnit = pick(row, ["UNIT OF STRENGTH", "Strength Unit"]);
  const strengthText = pick(row, ["strengthText", "Strength Text", "Strength + Strength Unit"]) || [strengthValue, strengthUnit].filter(Boolean).join(" ").trim() || null;
  const dosageForm = pick(row, ["dosageForm", "Dosage Form", "PHARMACEUTICAL FORM", "Pharmaceutical Form", "Form"]);
  const route = pick(row, ["route", "Route", "ROUTE OF ADMINISTRATION", "Route of Administration"]);
  const packageText = pick(row, ["packageText", "Package", "Pack", "PACK SIZE", "Pack Size", "Package Size"]);
  const registrationNumber = pick(row, ["registrationNumber", "Registration Number", "DRUG REGISTRATION NUMBER", "Register Number", "DRN", "Reg No"]);
  const priceText = pick(row, ["officialPriceText", "priceText", "price_egp", "Price", "RETAIL PRICE", "Public Price", "Selling Price", "Public Price (KWD)"]);
  return {
    tradeName,
    tradeNameArabic,
    genericName,
    scientificName: genericName,
    familyText: pick(row, ["drug_class", "drugClass", "Drug Class", "Therapeutic Class"]),
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
    raw: officialRaw,
    rawHashInput: __sourceRowHashRaw ?? officialRaw
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
      sourceSnapshotJson: { sourceCode: source.code, sourceUrl: snapshot.sourceUrl, finalUrl: snapshot.finalUrl, contentType: snapshot.contentType, contentDisposition: snapshot.contentDisposition, fileName: parsed.fileName, sourceLabel: snapshot.sourceLabel },
      coverageJson: { countryCode, sourceCode: source.code }
    }
  });

  let rowsImported = 0;
  let rowsNeedsReview = 0;
  let rowsSkipped = 0;
  let rowsFailed = 0;
  let rowsInserted = 0;
  let rowsUpdated = 0;
  let rowsUnchanged = 0;
  let rowsConflicted = 0;
  let confidenceTotal = 0;
  const touchedProductIds = new Set();

  if (mode === "dry-run") {
    for (const rawRow of parsed.rows) {
      try {
        const row = normalizeOfficialRow(rawRow, countryCode);
        if (!row.tradeName && !row.genericName) {
          rowsSkipped += 1;
          continue;
        }
        const product = await prisma.drugMarketProduct.findFirst({
          where: {
            tradeName: { equals: row.tradeName || row.genericName, mode: "insensitive" },
            genericName: row.genericName ? { equals: row.genericName, mode: "insensitive" } : null,
            manufacturer: row.manufacturer ? { equals: row.manufacturer, mode: "insensitive" } : null
          },
          select: { id: true, verificationStatus: true }
        });
        if (!product) {
          rowsInserted += 1;
          rowsNeedsReview += 1;
        } else {
          const hash = rowHash(row.rawHashInput ?? row.raw, row.countryCode);
          const variant = await prisma.drugMarketVariant.findFirst({
            where: {
              productId: product.id,
              countryCode: row.countryCode,
              OR: [{ sourceRowHash: hash }, { sourceId: source.id, tradeName: { equals: row.tradeName || row.genericName, mode: "insensitive" } }]
            },
            select: { sourceRowHash: true, verificationStatus: true, sourceId: true }
          });
          if (!variant) rowsInserted += 1;
          else if (variant.verificationStatus === "verified" && variant.sourceRowHash !== hash) rowsConflicted += 1;
          else if (variant.sourceRowHash === hash) rowsUnchanged += 1;
          else rowsUpdated += 1;
          if (!variant || variant.verificationStatus !== "verified") rowsNeedsReview += 1;
        }
        rowsImported += 1;
        confidenceTotal += row.parserConfidence;
      } catch {
        rowsFailed += 1;
      }
    }
  } else {
    for (const [index, rawRow] of parsed.rows.entries()) {
      try {
        const row = normalizeOfficialRow(rawRow, countryCode);
        if (!row.tradeName && !row.genericName) {
          rowsSkipped += 1;
          if (row.parserConfidence < 0.55) await createReviewWarning(source.id, parsed.fileName, index + 1, "Official row lacked trade and generic name.", rawRow, row);
          continue;
        }
        const product = await upsertProduct(row, now);
        const { variant, action } = await upsertVariant(product.id, row, run.id, source.id, now);
        touchedProductIds.add(product.id);
        if (action === "inserted") rowsInserted += 1;
        if (action === "updated") rowsUpdated += 1;
        if (action === "unchanged") rowsUnchanged += 1;
        if (action === "conflict") rowsConflicted += 1;
        if (variant.verificationStatus !== "verified") {
          rowsNeedsReview += 1;
          await createOfficialReviewItem(product.id, variant.id, row, source.code);
        }
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

  const status = mode === "dry-run" ? "dry_run_complete" : rowsFailed ? "needs_review" : "imported";
  await prisma.drugMarketImportRun.update({
    where: { id: run.id },
    data: {
      status,
      message: mode === "dry-run" ? "Dry run completed; no rows written." : "Official source import completed. Rows require review before verification.",
      rowsImported,
      rowsNeedsReview,
      rowsSkipped,
      rowsFailed,
      coverageJson: { countryCode, sourceCode: source.code, rowsInserted, rowsUpdated, rowsUnchanged, rowsConflicted, duplicateCount: rowsUnchanged },
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
      latestSourceLabel: snapshot.sourceLabel ?? parsed.fileName
    }
  });

  return { source: source.code, status, rowsImported, rowsSeen: parsed.rows.length, rowsInserted, rowsUpdated, rowsUnchanged, duplicateCount: rowsUnchanged, conflictCount: rowsConflicted, rowsNeedsReview, rowsSkipped, rowsFailed, fileSha256: parsed.fileSha256, sourceUrl: snapshot.finalUrl ?? snapshot.sourceUrl };
}

async function createOfficialReviewItem(productId, variantId, row, sourceCode) {
  await prisma.drugMarketManualReviewQueue.deleteMany({
    where: { queueType: "official_import_review", variantId, status: "open" }
  });
  const reasons = ["Imported official medication row requires admin/owner review before verification"];
  if (!row.genericName) reasons.push("missing generic/scientific name");
  if (!row.strengthText) reasons.push("missing strength");
  if (!row.dosageForm) reasons.push("missing dosage form");
  if ((row.officialPriceAmount || row.officialPriceText) && !row.currency) reasons.push("missing price currency");
  if (row.parserConfidence < 0.65) reasons.push("low parser confidence");
  await prisma.drugMarketManualReviewQueue.create({
    data: {
      queueType: "official_import_review",
      productId,
      variantId,
      reason: `${row.countryCode} ${sourceCode}: ${reasons.join("; ")}.`
    }
  });
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
  return [row.tradeName, row.tradeNameArabic, row.genericName, row.scientificName, row.familyText, row.strengthText, row.dosageForm, row.route, row.packageText, row.registrationNumber, row.atcCode, row.manufacturer, row.marketingCompany].filter(Boolean).join(" ").toLowerCase();
}

async function upsertProduct(row, fetchedAt) {
  const tradeName = row.tradeName || row.genericName;
  const existing = await prisma.drugMarketProduct.findFirst({ where: { tradeName, genericName: row.genericName, manufacturer: row.manufacturer, isDemo: false } });
  if (existing?.verificationStatus === "verified") return existing;
  const data = {
    tradeName,
    genericName: row.genericName,
    scientificName: row.scientificName,
    normalizedSearchText: searchText(row),
    familyText: row.familyText,
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
  const sourceRowHash = rowHash(row.rawHashInput ?? row.raw, row.countryCode);
  const hashExisting = await prisma.drugMarketVariant.findUnique({ where: { countryCode_sourceRowHash: { countryCode: row.countryCode, sourceRowHash } } });
  const existing = hashExisting ?? await prisma.drugMarketVariant.findFirst({
    where: {
      productId,
      countryCode: row.countryCode,
      sourceId,
      tradeName: row.tradeName || row.genericName,
      genericName: row.genericName,
      route: row.route,
      manufacturer: row.manufacturer
    }
  });
  if (existing?.verificationStatus === "verified") {
    await prisma.drugMarketManualReviewQueue.create({
      data: { queueType: "verified_row_conflict", productId, variantId: existing.id, reason: "Verified official medication row matched a new import. Manual review required." }
    });
    return { variant: existing, action: "conflict" };
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
  const variant = existing ? await prisma.drugMarketVariant.update({ where: { id: existing.id }, data }) : await prisma.drugMarketVariant.create({ data });
  return { variant, action: existing ? (hashExisting ? "unchanged" : "updated") : "inserted" };
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

function extensionFromUrlOrType(url, contentType, contentDisposition = "", buffer = Buffer.alloc(0)) {
  const pathExt = extname(new URL(url).pathname).toLowerCase();
  if (pathExt) return pathExt;
  const dispositionExt = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
  if (dispositionExt && extname(dispositionExt)) return extname(dispositionExt).toLowerCase();
  if (buffer.subarray(0, 4).toString("binary") === "PK\u0003\u0004") return ".xlsx";
  if (buffer.subarray(0, 4).toString("utf8") === "%PDF") return ".pdf";
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
  const maxPages = options.maxPages === "all" ? 10 : Math.max(1, Math.min(Number(options.maxPages ?? 1) || 1, 10));
  const rows = [];
  let lastUrl = source.officialUrl || "https://www.sfda.gov.sa/en/drugs-list";
  try {
    for (let page = 1; page <= maxPages; page += 1) {
      const pageUrl = page === 1 ? "https://www.sfda.gov.sa/en/drugs-list" : `https://www.sfda.gov.sa/en/drugs-list?pg=${page}`;
      enforceOfficialUrlPolicy(source, pageUrl);
      const response = await fetch(pageUrl, { headers: requestHeaders(pageUrl), signal: AbortSignal.timeout(30000) });
      lastUrl = response.url || pageUrl;
      if (!response.ok) throw new Error(`SFDA public HTML HTTP ${response.status}`);
      const html = await response.text();
      const pageRows = parseSfdaHtmlRows(html);
      if (!pageRows.length && page === 1) break;
      rows.push(...pageRows);
      if (!pageRows.length) break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "SFDA public HTML fetch failed.";
    const run = await recordBlockedRun(source, "failed", `SFDA public list fetch failed or timed out: ${message}. No bypass attempted.`);
    throw new Error(run.message ?? message);
  }
  if (!rows.length) {
    const run = await recordBlockedRun(source, "failed", `SFDA public list did not expose a parseable server-rendered table. maxPages=${options.maxPages ?? "default"}. No bypass attempted.`);
    throw new Error(run.message ?? "SFDA source unavailable.");
  }
  return {
    kind: "rows",
    sourceUrl: "https://www.sfda.gov.sa/en/drugs-list",
    finalUrl: lastUrl,
    contentType: "text/html",
    fetchedAt: new Date(),
    fileName: `sfda-public-html-${new Date().toISOString().slice(0, 10)}.json`,
    fileSha256: sha256Buffer(Buffer.from(JSON.stringify(rows))),
    rows
  };
}

function isRelevantOfficialFileLink(sourceCode, combined) {
  const text = combined.toLowerCase();
  if (blockedUrlPattern.test(text)) return false;
  if (sourceCode === "QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES") {
    return /registered pharmaceutical products|priced products|products with prices|\.xlsx/i.test(combined);
  }
  if (sourceCode === "KUWAIT_MOH_DRUG_PRICE_LIST") return /drug price list|drugpricelist|\.pdf/i.test(combined);
  if (sourceCode === "KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST") return /food supplement price list|foodsupplement|\.pdf/i.test(combined);
  if (sourceCode === "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES") {
    return /pharmaceutical products list with prices/i.test(combined) && !/supp list/i.test(combined);
  }
  if (sourceCode === "OMAN_MOH_SUPP_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES") {
    return /supp list registered pharmaceutical products list with prices/i.test(combined);
  }
  return /\.(xlsx?|csv|json|pdf)(?:$|[?#])|price|drug|medicine|pharmaceutical/i.test(combined);
}

function isPreferredSourceLink(sourceCode, label, url) {
  return isRelevantOfficialFileLink(sourceCode, `${label} ${url}`) && /\.(xlsx?|csv|json|pdf)(?:$|[?#])/i.test(url);
}

function parseSfdaHtmlRows(html) {
  const $ = loadHtml(html);
  const rows = [];
  $("table tr").each((_, tr) => {
    const cells = $(tr).find("th,td").map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim()).get();
    if (cells.length < 5) return;
    if (/scientific name/i.test(cells.join(" "))) return;
    rows.push({
      "Scientific Name": cells[0] ?? "",
      "Trade Name": cells[1] ?? "",
      Strength: cells[2] ?? "",
      "Dosage Form": cells[3] ?? "",
      Price: cells[4] ?? ""
    });
  });
  if (!rows.length) {
    const body = $("body").text().replace(/\s+/g, " ").trim();
    const pattern = /([A-Z][A-Z0-9 ,+\-/]+)\s+([A-Z][A-Z0-9 +\-/]+)\s+([0-9][A-Z0-9 ./%\\-]*)\s+(TABLET|CAPSULE|SUSP|SUSPENSION|CREAM|OINTMENT|SOLUTION|INJECTION|SYRUP)\s+([0-9]+(?:\.[0-9]+)?)/gi;
    for (const match of body.matchAll(pattern)) {
      rows.push({
        "Scientific Name": match[1],
        "Trade Name": match[2],
        Strength: match[3],
        "Dosage Form": match[4],
        Price: match[5]
      });
      if (rows.length >= 200) break;
    }
  }
  return rows;
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
