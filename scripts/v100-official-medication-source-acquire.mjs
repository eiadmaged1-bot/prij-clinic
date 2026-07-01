import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const args = parseArgs();
const storageDir = resolve("storage/official-medication-sources");
const manifestPath = join(storageDir, "source-manifest.json");
const allowedExtensions = new Set([".csv", ".xlsx", ".xls", ".json", ".jsonl", ".pdf", ".zip"]);
const sourceCodes = new Set(["NHRA", "OMAN_MOH", "EDA", "SFDA", "UAE", "OTHER"]);
const countryCodes = new Set(["BH", "OM", "EG", "KSA", "UAE", "YEM"]);
const blockedUrlPattern = /(login|signin|sign-in|captcha|paywall|checkout|cart|order|stock|availability|purchase|basket)/i;
const knownOfficialHosts = {
  NHRA: ["nhra.bh", "www.nhra.bh"],
  OMAN_MOH: ["moh.gov.om", "www.moh.gov.om"],
  EDA: ["edaegypt.gov.eg", "www.edaegypt.gov.eg", "eddb.edaegypt.gov.eg"],
  SFDA: ["sfda.gov.sa", "www.sfda.gov.sa"],
  UAE: ["mohap.gov.ae", "www.mohap.gov.ae"],
  OTHER: []
};

try {
  if (args.list === "true") {
    listSources();
  } else {
    validateInput();
    if (args.file) acquireFile();
    else if (args.url) await acquireUrl();
    else throw new Error("Provide --file or --url, or use --list.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function validateInput() {
  if (!sourceCodes.has(args.source)) throw new Error("--source must be one of NHRA, OMAN_MOH, EDA, SFDA, UAE, OTHER.");
  if (!countryCodes.has(args.country)) throw new Error("--country must be one of BH, OM, EG, KSA, UAE, YEM.");
  if (args.file && args.url) throw new Error("Use only one input: --file or --url.");
}

function acquireFile() {
  const input = resolve(args.file);
  if (!existsSync(input) || !statSync(input).isFile()) throw new Error(`Source file not found: ${input}`);
  const extension = extname(input).toLowerCase();
  if (!allowedExtensions.has(extension)) throw new Error(`Unsupported source extension: ${extension || "none"}`);
  const buffer = readFileSync(input);
  const sha256 = hashBuffer(buffer);
  const destination = destinationPath(`${args.source}-${args.country}-${basename(input)}`, extension, sha256);
  if (args.apply !== "true") return printDryRun({ action: "copy", input, destination, sha256, extension });
  mkdirSync(storageDir, { recursive: true });
  copyFileSync(input, destination);
  appendManifest({ mode: "copy", source: args.source, country: args.country, inputPath: input, filePath: destination, extension, sha256, acquiredAt: new Date().toISOString() });
  console.log(JSON.stringify({ status: "copied", filePath: destination, sha256 }, null, 2));
}

async function acquireUrl() {
  const url = parseAllowedUrl(args.url);
  const extension = extname(url.pathname).toLowerCase();
  if (!allowedExtensions.has(extension)) throw new Error(`Unsupported URL extension: ${extension || "none"}`);
  if (args.apply !== "true") {
    return printDryRun({ action: "download", url: url.toString(), source: args.source, country: args.country, extension });
  }
  mkdirSync(storageDir, { recursive: true });
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}.`);
  const finalUrl = new URL(response.url || url.toString());
  parseAllowedUrl(finalUrl.toString());
  const buffer = Buffer.from(await response.arrayBuffer());
  const sha256 = hashBuffer(buffer);
  const finalExtension = extname(finalUrl.pathname).toLowerCase() || extension;
  if (!allowedExtensions.has(finalExtension)) throw new Error(`Downloaded file extension is unsupported: ${finalExtension || "none"}`);
  const destination = destinationPath(`${args.source}-${args.country}-${basename(finalUrl.pathname) || "source-file"}`, finalExtension, sha256);
  writeFileSync(destination, buffer);
  appendManifest({
    mode: "download",
    source: args.source,
    country: args.country,
    sourceUrl: url.toString(),
    finalUrl: finalUrl.toString(),
    filePath: destination,
    extension: finalExtension,
    sha256,
    acquiredAt: new Date().toISOString(),
    contentType: response.headers.get("content-type") ?? null,
    lastModified: response.headers.get("last-modified") ?? null
  });
  console.log(JSON.stringify({ status: "downloaded", filePath: destination, sha256 }, null, 2));
}

function parseAllowedUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Invalid --url.");
  }
  if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Only HTTP(S) URLs are supported.");
  if (blockedUrlPattern.test(parsed.toString())) throw new Error("Refused login, CAPTCHA, paywall, retail, stock, cart, checkout, purchase, or order URL.");
  const hosts = knownOfficialHosts[args.source] ?? [];
  const hostAllowed = hosts.some((host) => parsed.hostname.toLowerCase() === host || parsed.hostname.toLowerCase().endsWith(`.${host}`));
  if (!hostAllowed && args["allow-public-url-confirmed"] !== "true") {
    throw new Error("Unknown URL host refused unless --allow-public-url-confirmed is passed after owner/public-source review.");
  }
  return parsed;
}

function listSources() {
  mkdirSync(storageDir, { recursive: true });
  const manifest = readManifest();
  const files = readdirSync(storageDir)
    .filter((name) => name !== "source-manifest.json")
    .map((name) => {
      const path = join(storageDir, name);
      const stat = statSync(path);
      return { fileName: name, path, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString(), sha256: hashFile(path) };
    });
  console.log(JSON.stringify({ storageDir, manifestPath, manifestEntries: manifest.entries.length, files }, null, 2));
}

function destinationPath(name, extension, sha256) {
  const stem = name.replace(/\.[^.]+$/i, "").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "source-file";
  return join(storageDir, `${stem}-${sha256.slice(0, 12)}${extension}`);
}

function appendManifest(entry) {
  const manifest = readManifest();
  manifest.entries.push(entry);
  manifest.updatedAt = new Date().toISOString();
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function readManifest() {
  if (!existsSync(manifestPath)) return { format: "official-medication-source-manifest-v1", updatedAt: null, entries: [] };
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  return { format: parsed.format ?? "official-medication-source-manifest-v1", updatedAt: parsed.updatedAt ?? null, entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
}

function printDryRun(summary) {
  console.log(JSON.stringify({ mode: "dry-run", would: summary, note: "Pass --apply to write into ignored storage/official-medication-sources/." }, null, 2));
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function hashFile(path) {
  return hashBuffer(readFileSync(path));
}

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = "true";
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
