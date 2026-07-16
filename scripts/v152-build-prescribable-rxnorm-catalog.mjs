import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const RX = "https://rxnav.nlm.nih.gov/REST/Prescribe";
const RXCLASS = "https://rxnav.nlm.nih.gov/REST/rxclass";
const output = "apps/api/prisma/reference/v152-prescribable-rxnorm-atc.json";
const target = 540;
const preferredPrefixes = ["G", "J01", "J02", "J05", "R", "C", "A", "B", "D", "H", "M", "N", "P", "S01", "V03", "L01", "L02", "L03", "L04"];

const [rxVersion, atcVersionData, conceptsData, classesData] = await Promise.all([
  getJson("https://rxnav.nlm.nih.gov/REST/version.json"),
  getJson(`${RXCLASS}/version/ATC.json`),
  getJson(`${RX}/allconcepts.json?tty=IN+PIN`),
  getJson(`${RXCLASS}/allClasses.json?classTypes=ATC1-4`)
]);
const prescribable = conceptsData.minConceptGroup?.minConcept ?? conceptsData.rxnormdata?.minConceptGroup?.minConcept ?? [];
const byRxcui = new Map(prescribable.filter((row) => row.rxcui && row.name).map((row) => [row.rxcui, row]));
const byName = new Map(prescribable.filter((row) => row.rxcui && row.name).map((row) => [normalize(row.name), row]));
const allClasses = classesData.rxclassMinConceptList?.rxclassMinConcept ?? classesData.rxclassdata?.rxclassMinConceptList?.rxclassMinConcept ?? [];
const classes = allClasses.filter((row) => row.classId?.length === 5 && preferredPrefixes.some((prefix) => row.classId.startsWith(prefix))).filter((row) => !/combination|radiopharmaceutical|contrast media/i.test(row.className ?? "")).sort((a, b) => priority(a.classId) - priority(b.classId) || a.classId.localeCompare(b.classId));

const familyMembers = [];
for (let offset = 0; offset < classes.length; offset += 8) {
  const values = await Promise.all(classes.slice(offset, offset + 8).map(async (family) => {
    const data = await getJson(`${RXCLASS}/classMembers.json?classId=${encodeURIComponent(family.classId)}&relaSource=ATC&trans=1&ttys=IN+PIN`);
    const members = data.drugMemberGroup?.drugMember ?? data.rxclassdata?.drugMemberGroup?.drugMember ?? [];
    return { family, members: members.map((value) => value?.minConcept).filter((concept) => concept?.rxcui && concept?.name).map((concept) => byRxcui.get(concept.rxcui) ?? byName.get(normalize(concept.name))).filter(Boolean) };
  }));
  familyMembers.push(...values.filter((value) => value.members.length));
  await pause(80);
}
const curatedFamilies = familyMembers.slice(0, 180);

const selected = new Map();
for (const { family, members } of curatedFamilies) add(members[0], family);
for (const { family, members } of curatedFamilies) for (const member of members) { if (selected.size >= target) break; add(member, family); }

const records = [...selected.values()].sort((a, b) => a.name.localeCompare(b.name));
const familyCodes = new Set(records.flatMap((record) => record.families.map((family) => family.code)));
if (records.length < 500) throw new Error(`Prescribable RxNorm yielded only ${records.length} bounded identities.`);
if (familyCodes.size < 120 || familyCodes.size > 180) throw new Error(`Meaningful family target failed: ${familyCodes.size} families.`);
const artifact = {
  schemaVersion: 2,
  source: {
    identity: "RxNorm Current Prescribable Content",
    identityOrganization: "U.S. National Library of Medicine",
    identityVersion: rxVersion.version ?? rxVersion.rxnormdata?.version,
    classification: "ATC through NLM RxClass",
    classificationOrganization: "WHO Collaborating Centre for Drug Statistics Methodology / NLM",
    atcVersion: atcVersionData.relaSourceVersion ?? atcVersionData.rxclassdata?.relaSourceVersion,
    retrievedAt: new Date().toISOString(),
    api: RX,
    terms: "https://lhncbc.nlm.nih.gov/RxNav/TermsofService.html",
    notice: "This product uses publicly available NLM data; NLM is not responsible for and does not endorse this product. Identity and classification are not clinical recommendations."
  },
  selection: { target, actual: records.length, populatedFamilies: familyCodes.size, preferredPrefixes, singleIngredientTermTypes: ["IN", "PIN"] },
  records
};
const body = `${JSON.stringify(artifact, null, 2)}\n`;
artifact.checksum = createHash("sha256").update(body).digest("hex");
await mkdir("apps/api/prisma/reference", { recursive: true });
await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
const verified = JSON.parse(await readFile(output, "utf8"));
if (verified.records.length !== records.length) throw new Error("Written artifact verification failed.");
console.log(`V152 PRESCRIBABLE RXNORM PASS generics=${records.length} families=${familyCodes.size} rxnorm=${artifact.source.identityVersion} atc=${artifact.source.atcVersion} sha256=${artifact.checksum}`);

function add(member, family) {
  if (!member || selected.size >= target) return;
  const key = normalize(member.name);
  if (!key || /\b(and|with)\b|\/|\+/.test(key)) return;
  const record = selected.get(key) ?? { rxcui: member.rxcui, tty: member.tty, name: member.name, normalizedName: key, aliases: [], families: [] };
  if (family && !record.families.some((item) => item.code === family.classId)) record.families.push({ code: family.classId, name: family.className });
  selected.set(key, record);
}
function normalize(value) { return String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}%/.\s-]+/gu, " ").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim(); }
function priority(code) { const index = preferredPrefixes.findIndex((prefix) => code.startsWith(prefix)); return index < 0 ? 999 : index; }
function pause(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function getJson(url, attempt = 1) { const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "PrijClinic/1.5.2 governed official-source importer" } }); if (response.ok) return response.json(); if (attempt < 5 && (response.status === 429 || response.status >= 500)) { await pause(300 * 2 ** (attempt - 1)); return getJson(url, attempt + 1); } throw new Error(`Official source request failed ${response.status}: ${url}`); }
