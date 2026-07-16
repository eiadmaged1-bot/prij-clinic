import { mkdir, writeFile } from "node:fs/promises";

const API = "https://rxnav.nlm.nih.gov/REST/rxclass";
const output = "apps/api/prisma/reference/v151-rxnav-atc-identity.json";
const target = 340;
const preferredPrefixes = ["G", "J01", "J02", "J05", "R", "C", "A", "B", "D", "H", "M", "N", "P", "S01", "V03", "L03", "L04"];

const versionData = await getJson(`${API}/version/ATC.json`);
const classesData = await getJson(`${API}/allClasses.json?classTypes=ATC1-4`);
const version = versionData.relaSourceVersion ?? versionData.rxclassdata?.relaSourceVersion ?? "unavailable";
const allClasses = classesData.rxclassMinConceptList?.rxclassMinConcept ?? classesData.rxclassdata?.rxclassMinConceptList?.rxclassMinConcept ?? [];
const classes = allClasses
  .filter((item) => item.classId?.length === 5 && preferredPrefixes.some((prefix) => item.classId.startsWith(prefix)))
  .filter((item) => !/combination|radiopharmaceutical|contrast media/i.test(item.className ?? ""))
  .sort((left, right) => priority(left.classId) - priority(right.classId) || left.classId.localeCompare(right.classId));

const familyMembers = [];
for (let offset = 0; offset < classes.length; offset += 10) {
  const batch = classes.slice(offset, offset + 10);
  const values = await Promise.all(batch.map(async (family) => {
    const data = await getJson(`${API}/classMembers.json?classId=${encodeURIComponent(family.classId)}&relaSource=ATC&trans=1&ttys=IN+PIN`);
    const members = data.drugMemberGroup?.drugMember ?? data.rxclassdata?.drugMemberGroup?.drugMember ?? [];
    return { family, members: members.map(toMember).filter(Boolean) };
  }));
  familyMembers.push(...values.filter((value) => value.members.length));
}

const selected = new Map();
// First guarantee useful family breadth, then fill the bounded identity catalog.
for (const { family, members } of familyMembers) add(members[0], family);
for (const { family, members } of familyMembers) for (const member of members) { if (selected.size >= target) break; add(member, family); }

const records = [...selected.values()].sort((left, right) => left.name.localeCompare(right.name));
const familyCodes = new Set(records.flatMap((record) => record.families.map((family) => family.code)));
if (records.length < 300) throw new Error(`RxNav/ATC source yielded only ${records.length} bounded identities; refusing to claim the minimum target.`);
if (familyCodes.size < 100) throw new Error(`RxNav/ATC source yielded only ${familyCodes.size} populated families; refusing to claim the minimum target.`);

const artifact = {
  schemaVersion: 1,
  source: {
    identity: "RxNorm",
    identityOrganization: "U.S. National Library of Medicine",
    classification: "ATC",
    classificationOrganization: "WHO Collaborating Centre for Drug Statistics Methodology",
    rxClassAtcVersion: version,
    retrievedAt: new Date().toISOString(),
    api: API,
    notice: "Public RxNorm ingredient identities mapped by NLM RxClass to ATC classes. Classification only; no indication, dose, pregnancy, renal, interaction, or monitoring claims."
  },
  selection: { target, actual: records.length, populatedFamilies: familyCodes.size, preferredPrefixes, excludedCombinationClasses: true },
  records
};
await mkdir("apps/api/prisma/reference", { recursive: true });
await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(`V151 RXNAV ATC IDENTITY PASS generics=${records.length} families=${familyCodes.size} version=${version} output=${output}`);

function add(member, family) {
  if (!member || selected.size >= target) return;
  const key = normalize(member.name);
  if (!key || /\b(and|with)\b|\/|\+/.test(key)) return;
  const record = selected.get(key) ?? { rxcui: member.rxcui, name: member.name, normalizedName: key, families: [] };
  if (!record.families.some((item) => item.code === family.classId)) record.families.push({ code: family.classId, name: family.className });
  selected.set(key, record);
}
function toMember(value) { const concept = value?.minConcept; if (!concept?.rxcui || !concept?.name || !["IN", "PIN"].includes(concept.tty)) return null; return { rxcui: concept.rxcui, name: concept.name, tty: concept.tty }; }
function normalize(value) { return String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}%/.\s-]+/gu, " ").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim(); }
function priority(code) { const index = preferredPrefixes.findIndex((prefix) => code.startsWith(prefix)); return index < 0 ? 999 : index; }
async function getJson(url, attempt = 1) { const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "PrijClinic/1.5.1 governed identity importer" } }); if (response.ok) return response.json(); if (attempt < 4 && response.status >= 429) { await new Promise((resolve) => setTimeout(resolve, 300 * attempt)); return getJson(url, attempt + 1); } throw new Error(`Source request failed ${response.status}: ${url}`); }
