import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const identityPath = "apps/api/prisma/reference/v152-prescribable-rxnorm-atc.json";
const output = "apps/api/prisma/reference/v152-openfda-label-profiles.json";
const target = 300;
const API = "https://api.fda.gov/drug/label.json";
const identity = JSON.parse(await readFile(identityPath, "utf8"));
const existing = await readFile(output, "utf8").then(JSON.parse).catch(() => null);
const completed = new Map((existing?.profiles ?? []).map((profile) => [profile.rxcui, profile]));
const misses = new Set(existing?.misses ?? []);
const ordered = [...identity.records].sort((a, b) => priority(a) - priority(b) || a.name.localeCompare(b.name));
let sourceLastUpdated = existing?.source?.lastUpdated ?? null;

for (const record of ordered) {
  if (completed.size >= target) break;
  if (completed.has(record.rxcui) || misses.has(record.rxcui)) continue;
  const response = await query(record.name);
  sourceLastUpdated = response?.meta?.last_updated ?? sourceLastUpdated;
  const representative = chooseRepresentative(record.name, response?.results ?? []);
  if (!representative) misses.add(record.rxcui);
  else completed.set(record.rxcui, toProfile(record, representative));
  if ((completed.size + misses.size) % 10 === 0) await save(false);
  await pause(230);
}

if (completed.size < target) { await save(false); throw new Error(`Official exact-name labels found for ${completed.size} generics; refusing the ${target}-profile claim.`); }
await save(true);
console.log(`V152 OPENFDA LABEL PASS profiles=${completed.size} misses=${misses.size} sourceUpdated=${sourceLastUpdated}`);

async function save(complete) {
  const artifact = {
    schemaVersion: 1,
    source: { title: "openFDA drug label API (FDA Structured Product Label data)", organization: "U.S. Food and Drug Administration", api: API, documentation: "https://open.fda.gov/apis/drug/label/how-to-use-the-endpoint/", lastUpdated: sourceLastUpdated, retrievedAt: existing?.source?.retrievedAt ?? new Date().toISOString(), license: "https://open.fda.gov/license/", status: complete ? "SOURCE_VERIFIED" : "SOURCE_INCOMPLETE", notice: "Official label reference sections only. They are not patient-specific recommendations and never select a dose or treatment." },
    selection: { target, actual: completed.size, misses: misses.size, representativePolicy: ["exact normalized generic identity", "current human prescription label preferred", "single-ingredient label preferred", "non-repackaged label preferred when metadata identifies it", "latest effective date", "alternatives retained as conflict metadata"] },
    profiles: [...completed.values()].sort((a, b) => a.genericName.localeCompare(b.genericName)),
    misses: [...misses].sort()
  };
  const canonical = JSON.stringify(artifact);
  artifact.checksum = createHash("sha256").update(canonical).digest("hex");
  await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}

async function query(name, attempt = 1) {
  const search = `openfda.generic_name.exact:${JSON.stringify(name.toUpperCase())}`;
  const url = `${API}?search=${encodeURIComponent(search)}&sort=effective_time:desc&limit=10`;
  const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "PrijClinic/1.5.2 governed official-label importer" } });
  if (response.status === 404) return null;
  if (response.ok) return response.json();
  if (attempt < 6 && (response.status === 429 || response.status >= 500)) { await pause(500 * 2 ** (attempt - 1)); return query(name, attempt + 1); }
  throw new Error(`openFDA request failed ${response.status}`);
}

function chooseRepresentative(name, rows) {
  const expected = normalize(name);
  const exact = rows.filter((row) => (row.openfda?.generic_name ?? []).some((item) => normalize(item) === expected));
  const ranked = exact.map((row) => ({ row, score: score(row) })).sort((a, b) => b.score - a.score || String(b.row.effective_time ?? "").localeCompare(String(a.row.effective_time ?? "")) || String(a.row.set_id ?? "").localeCompare(String(b.row.set_id ?? "")));
  if (!ranked.length) return null;
  const selected = ranked[0].row;
  const selectedFingerprint = safetyFingerprint(selected);
  return { ...selected, alternatives: ranked.slice(1).filter((item) => safetyFingerprint(item.row) !== selectedFingerprint).map((item) => ({ setId: item.row.set_id, effectiveTime: item.row.effective_time, productType: item.row.openfda?.product_type?.[0] ?? null })) };
}
function score(row) {
  const productType = String(row.openfda?.product_type?.[0] ?? "");
  const labeler = String(row.openfda?.manufacturer_name?.[0] ?? "");
  const ingredients = row.openfda?.generic_name ?? [];
  return (productType === "HUMAN PRESCRIPTION DRUG" ? 100 : productType.startsWith("HUMAN") ? 50 : 0) + (ingredients.length === 1 && !/[;,/]|\bAND\b/i.test(ingredients[0]) ? 30 : 0) + (!/repack|relabel/i.test(labeler) ? 10 : 0) + (row.boxed_warning?.length ? 1 : 0);
}
function toProfile(record, label) {
  const sections = {};
  const mappings = {
    indications: ["indications_and_usage"],
    mechanism: ["mechanism_of_action", "clinical_pharmacology"],
    contraindications: ["contraindications"],
    warnings: ["warnings_and_cautions", "warnings", "boxed_warning"],
    adverseEffects: ["adverse_reactions"],
    interactions: ["drug_interactions"],
    pregnancy: ["pregnancy", "teratogenic_effects", "nonteratogenic_effects"],
    lactation: ["lactation", "nursing_mothers"],
    renal: ["renal_impairment"],
    hepatic: ["hepatic_impairment"],
    monitoring: ["laboratory_tests", "precautions"],
    dosageForms: ["dosage_forms_and_strengths", "how_supplied"],
    routes: ["openfda.route"]
  };
  for (const [key, fields] of Object.entries(mappings)) {
    const values = fields.flatMap((field) => field === "openfda.route" ? label.openfda?.route ?? [] : label[field] ?? []).map(compactOfficialText).filter(Boolean);
    sections[key] = values.length ? { status: "SOURCE_VERIFIED", sourceSections: fields, referenceText: values } : { status: "SOURCE_INCOMPLETE", sourceSections: fields, referenceText: [] };
  }
  return { rxcui: record.rxcui, genericName: record.name, normalizedName: record.normalizedName, atcFamilies: record.families, source: { setId: label.set_id, effectiveTime: label.effective_time ?? null, version: label.version ?? null, applicationNumber: label.openfda?.application_number?.[0] ?? null, manufacturer: label.openfda?.manufacturer_name?.[0] ?? null, productType: label.openfda?.product_type?.[0] ?? null, sourceUrl: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${label.set_id}`, retrievedAt: new Date().toISOString() }, boxedWarning: Boolean(label.boxed_warning?.length), conflicts: label.alternatives?.length ? { status: "SOURCE_CONFLICT", alternatives: label.alternatives } : null, sections };
}
function compactOfficialText(value) { const text = String(value ?? "").replace(/\s+/g, " ").trim(); if (!text) return ""; const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text]; return sentences.slice(0, 3).join(" ").slice(0, 1200).trim(); }
function safetyFingerprint(label) { return createHash("sha256").update(["boxed_warning", "contraindications", "warnings_and_cautions", "pregnancy", "lactation", "renal_impairment", "hepatic_impairment"].flatMap((field) => label[field] ?? []).map((value) => String(value).replace(/\s+/g, " ").trim().toLowerCase()).join("\n")).digest("hex"); }
function normalize(value) { return String(value ?? "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim(); }
function priority(record) { const code = record.families?.[0]?.code ?? "Z"; const order = ["G", "J", "R", "C", "A", "D", "H", "B", "M", "N", "P", "V", "L", "S"]; const index = order.findIndex((prefix) => code.startsWith(prefix)); return index < 0 ? 999 : index; }
function pause(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
