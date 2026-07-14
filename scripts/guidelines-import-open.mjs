import * as cheerio from "cheerio";
import { officialGuidelineSources } from "./guidelines-official-sources.mjs";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const args = parseArgs(process.argv.slice(2));

if (args.url || args.title || args.source || args.specialty || args.topic) {
  await importSingleUrl(args);
} else {
  await importOfficialPack(args);
}

async function importSingleUrl(input) {
  if (!input.url || !input.title || !input.source || !input.specialty || !input.topic) {
    fail('Usage: npm run guidelines:import-open -- --url "https://example.org/guideline.pdf" --title "Example" --source "WHO" --specialty "obstetrics" --topic "antenatal care"');
  }
  const token = await login();
  const source = await findSource(token, input.source);
  const result = await importUrl(token, source, {
    url: input.url,
    title: input.title,
    specialty: input.specialty,
    topic: input.topic,
    versionLabel: input.version,
    approveRestricted: input.approveRestricted === "true"
  });
  console.log(result.skippedExisting ? `Skipped existing: ${result.document.title}` : `Imported for review: ${result.document.title}`);
  console.log(`Import job: ${result.importJobId}`);
}

async function importOfficialPack(input) {
  const token = await login();
  const existingBefore = await listDocuments(token);
  const existingByUrl = new Set(existingBefore.map((document) => document.originalUrl).filter(Boolean));
  const existingByTitle = new Set(existingBefore.map((document) => `${document.organization}:${document.title}`.toLowerCase()));
  const summary = {
    importedPdfs: 0,
    indexedDocuments: 0,
    indexedChunks: 0,
    linkOnly: 0,
    failed: 0,
    skippedExisting: 0
  };
  const failures = [];

  for (const entry of officialGuidelineSources) {
    try {
      const source = await findSource(token, entry.source);
      if (entry.linkOnly) {
        await upsertLinkOnlySource(token, entry);
        summary.linkOnly += 1;
        console.log(`link-only: ${entry.title} - ${entry.reason}`);
        continue;
      }

      const importTarget = await resolveImportTarget(entry);
      if (!importTarget.ok) {
        await upsertLinkOnlySource(token, { ...entry, reason: importTarget.reason });
        summary.linkOnly += 1;
        console.log(`link-only: ${entry.title} - ${importTarget.reason}`);
        continue;
      }

      if (existingByUrl.has(importTarget.url) || existingByTitle.has(`${entry.organization}:${entry.title}`.toLowerCase())) {
        summary.skippedExisting += 1;
        console.log(`skipped existing: ${entry.title}`);
        continue;
      }

      const result = await importUrl(token, source, { ...entry, url: importTarget.url });
      const chunkCount = result.document?._count?.chunks ?? 0;
      if (result.skippedExisting) {
        summary.skippedExisting += 1;
      } else {
        summary.importedPdfs += importTarget.pdf ? 1 : 0;
        summary.indexedDocuments += 1;
        summary.indexedChunks += chunkCount;
      }
      console.log(`${result.skippedExisting ? "skipped existing" : "imported"}: ${entry.title} (${chunkCount} chunks)`);
    } catch (error) {
      summary.failed += 1;
      failures.push(`${entry.title}: ${errorMessage(error)}`);
      console.error(`failed: ${entry.title} - ${errorMessage(error)}`);
    }
  }

  const documentsAfter = await listDocuments(token);
  const indexedAfter = documentsAfter.filter((document) => (document._count?.chunks ?? 0) > 0).length;
  const chunksAfter = documentsAfter.reduce((total, document) => total + (document._count?.chunks ?? 0), 0);

  console.log("");
  console.log("Official guideline import summary");
  console.log(`imported PDFs: ${summary.importedPdfs}`);
  console.log(`indexed documents: ${summary.indexedDocuments || indexedAfter}`);
  console.log(`indexed chunks: ${summary.indexedChunks || chunksAfter}`);
  console.log(`link-only: ${summary.linkOnly}`);
  console.log(`failed: ${summary.failed}`);
  console.log(`skipped existing: ${summary.skippedExisting}`);

  if (input.verifySearch !== "false") {
    const terms = ["antenatal", "caesarean", "preterm", "placenta", "endometriosis", "contraception"];
    for (const term of terms) {
      const body = await apiJson("GET", `/guidelines/search?q=${encodeURIComponent(term)}&limit=3`, token);
      console.log(`search ${term}: ${(body.results ?? []).length}`);
    }
  }

  if (summary.failed && indexedAfter === 0) {
    fail(`No official guideline documents were indexed. Failures: ${failures.join(" | ")}`);
  }
}

async function resolveImportTarget(entry) {
  if (isForbiddenUrl(entry.url)) return { ok: false, reason: "blocked login, subscription, account, or paywall URL" };
  const direct = await inspectUrl(entry.url);
  if (direct.pdf) return { ok: true, url: direct.url, pdf: true };
  if (!direct.html) return { ok: false, reason: direct.reason ?? "source did not return PDF or readable HTML" };
  const discovered = await discoverPdfUrl(direct.url, direct.text);
  if (!discovered) return { ok: false, reason: "no clearly available direct PDF link found" };
  const inspected = await inspectUrl(discovered);
  if (!inspected.pdf) return { ok: false, reason: "discovered link was not a PDF response" };
  return { ok: true, url: inspected.url, pdf: true };
}

async function inspectUrl(url) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        accept: "application/pdf,text/html;q=0.9,*/*;q=0.8",
        "user-agent": "PrijClinicGuidelineImporter/1.3.3 (+local owner-approved import)"
      }
    });
    if (!response.ok) return { ok: false, url, reason: `HTTP ${response.status}` };
    const contentType = response.headers.get("content-type") ?? "";
    const finalUrl = response.url || url;
    if (contentType.includes("application/pdf") || finalUrl.toLowerCase().endsWith(".pdf")) return { ok: true, url: finalUrl, pdf: true };
    if (contentType.includes("text/html")) return { ok: true, url: finalUrl, html: true, text: await response.text() };
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.subarray(0, 4).toString("utf8") === "%PDF") return { ok: true, url: finalUrl, pdf: true };
    return { ok: false, url: finalUrl, reason: `unsupported content-type ${contentType || "unknown"}` };
  } catch (error) {
    return { ok: false, url, reason: errorMessage(error) };
  }
}

async function discoverPdfUrl(pageUrl, html) {
  const $ = cheerio.load(html);
  const candidates = [];
  $("a[href]").each((_, element) => {
    const href = String($(element).attr("href") ?? "").trim();
    const text = $(element).text().trim().toLowerCase();
    if (!href) return;
    if (/login|signin|subscribe|paywall|account|session/i.test(href)) return;
    const looksLikePdf = /\.pdf($|[?#])/i.test(href) || text.includes("pdf") || text.includes("download");
    if (!looksLikePdf) return;
    try {
      const absoluteUrl = new URL(href, pageUrl).toString();
      let score = 0;
      if (text === "download" || text.startsWith("download (")) score += 20;
      if (/iris\.who\.int\/server\/api\/core\/bitstreams/i.test(absoluteUrl)) score += 12;
      if (/\.pdf($|[?#])/i.test(absoluteUrl)) score += 8;
      if (/web annex|annex|supplement|evidence base|corrigendum|slideshow|slide|pptx|dropbox|tur\.pdf|-[a-z]{3}\.pdf/i.test(`${text} ${absoluteUrl}`)) score -= 15;
      candidates.push({ url: absoluteUrl, score });
    } catch {
      // Ignore malformed links from source pages.
    }
  });
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.url ?? null;
}

async function findSource(token, organization) {
  const sources = await apiJson("GET", "/guidelines/sources", token);
  const candidates = (sources.sources ?? []).filter((item) => item.organization.toLowerCase() === organization.toLowerCase());
  let source =
    candidates.find((item) => item.sourceType === "OPEN_PUBLIC") ??
    candidates.find((item) => item.sourceType === "PUBLIC_RESTRICTED") ??
    candidates.find((item) => !["LOGIN_REQUIRED", "LINK_ONLY", "DO_NOT_IMPORT"].includes(item.sourceType)) ??
    candidates[0];
  if (!source) {
    source = await apiJson("POST", "/guidelines/sources", token, {
      name: `${organization} Official Guidelines`,
      organization,
      sourceType: "OPEN_PUBLIC",
      specialties: ["obstetrics", "gynecology"],
      defaultAccessLevel: "OWNER_DOCTOR",
      notes: "Created by the built-in v1.3.3 official guideline importer."
    });
  }
  if (["LOGIN_REQUIRED", "LINK_ONLY", "DO_NOT_IMPORT"].includes(source.sourceType)) {
    throw new Error(`Refusing import for ${source.organization}; source type is ${source.sourceType}.`);
  }
  return source;
}

async function upsertLinkOnlySource(token, entry) {
  const sources = await apiJson("GET", "/guidelines/sources", token);
  const existing = sources.sources?.find((item) => item.name.toLowerCase() === entry.title.toLowerCase());
  const body = {
    name: entry.title,
    organization: entry.organization,
    sourceType: "LINK_ONLY",
    websiteUrl: entry.url,
    specialties: [entry.specialty],
    defaultAccessLevel: "OWNER_DOCTOR",
    notes: `link-only / needs manual upload / ${entry.reason ?? "no direct open PDF confirmed"}`
  };
  if (existing) return apiJson("PATCH", `/guidelines/sources/${existing.id}`, token, body);
  return apiJson("POST", "/guidelines/sources", token, body);
}

async function importUrl(token, source, entry) {
  return apiJson("POST", "/guidelines/import-url", token, {
    sourceId: source.id,
    url: entry.url,
    title: entry.title,
    specialty: entry.specialty,
    topic: entry.topic,
    versionLabel: entry.versionLabel ?? "official-source-pack-v1.3.3",
    accessLevel: "OWNER_DOCTOR",
    userApprovedPublicRestricted: entry.approveRestricted === true || source.sourceType === "PUBLIC_RESTRICTED"
  });
}

async function listDocuments(token) {
  const body = await apiJson("GET", "/guidelines/documents", token);
  return body.documents ?? [];
}

async function login() {
  const identifier = process.env.GUIDELINE_IMPORT_LOGIN?.trim();
  const password = process.env.GUIDELINE_IMPORT_PASSWORD;
  if (!identifier || !password) throw new Error("GUIDELINE_IMPORT_LOGIN and GUIDELINE_IMPORT_PASSWORD are required.");
  const body = await apiJson("POST", "/auth/login", null, {
    identifier,
    password
  });
  return body.token;
}

async function apiJson(method, path, token, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${method} ${path} failed: ${JSON.stringify(parsed)}`);
  return parsed;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key.startsWith("--")) continue;
    const next = values[index + 1];
    parsed[key.replace(/^--/, "")] = next && !next.startsWith("--") ? next : "true";
    if (next && !next.startsWith("--")) index += 1;
  }
  return parsed;
}

function isForbiddenUrl(url) {
  return /(login|signin|subscribe|paywall|account|session)/i.test(url);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : "Unknown guideline import error.";
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
