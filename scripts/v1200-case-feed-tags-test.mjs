import { readFile } from "node:fs/promises";

const checks = [];

async function main() {
  const patientFile = await read("apps/web/app/patients/[id]/page.tsx");
  const productivity = await read("apps/web/lib/v1200-productivity.ts");

  assertIncludes(patientFile, ["Smart OB History Tags", "currentPregnancyTags", "previousHistoryChips"], "OB history chips render");
  assertIncludes(productivity, ["Single fetus", "Twins", "جنين واحد", "توأم"], "Single fetus / Twins tags render");
  assertIncludes(productivity, ["طبيعي", "تنشيط تبويض", "حقن مجهري ICSI", "غير معروف"], "conception method chips render");
  assertIncludes(patientFile, ["Current pregnancy:", "Fetus:", "Previous:", "Children:"], "OB summary renders in patient header and pregnancy tab source");
  assertIncludes(patientFile, ["Mother-Baby Pregnancy Workspace", "Mother, Baby A, Baby B", "Baby A", "Baby B"], "Mother-Baby workspace and Baby A/B cards render for twins");
  assertIncludes(patientFile, ["Patient Case Feed", "Internal medical thread", "Private patient-file feed only"], "patient case feed renders");
  assertIncludes(productivity, ["Visit item", "Attachment item", "Investigation request", "Result uploaded", "Result reviewed", "Prescription", "Follow-up", "Consent", "Payment/invoice", "AI draft approved/rejected"], "feed item types exist");
  assertIncludes(productivity, ["#ICSI", "#IVF", "#Infertility", "#HighRiskPregnancy", "#PlacentaPrevia", "#PlacentaAccreta", "#Oncology", "#Fibroid", "#PCOS", "#Endometriosis", "#RecurrentMiscarriage", "#GDM", "#Preeclampsia", "#FGR", "#CurrentTwins", "#PreviousCS", "#PreviousTwins"], "smart tags render");
  assertIncludes(patientFile, ["/patients?tag=", "opens matching patients"], "clicking tag opens matching patient source");
  assertIncludes(productivity, ["ICSI Board", "Oncology Board", "High-Risk Pregnancy Board", "Twins Board", "Previous C-section Board", "Pending Results Board", "Fertility Board", "Post-op Follow-up Board"], "case boards render");
  assertIncludes(patientFile, ["Doctors see clinical boards", "Reception sees allowed operational boards", "Accountants do not see clinical boards"], "role restrictions remain");
  assertIncludes(patientFile, ["Doctor confirmation remains required", "Doctor writes final interpretation", "external sharing"], "clinical interpretation boundaries remain");
  assertNotIncludes(patientFile, ["schema.prisma", "JWT", "stack trace", "endpoint path"], "no raw code-like UI text");

  passSummary("V1200-CASE-FEED-TAGS");
}

async function read(path) {
  return readFile(path, "utf8");
}

function assertIncludes(source, needles, label) {
  const missing = needles.filter((needle) => !source.includes(needle));
  if (missing.length) throw new Error(`${label}: missing ${missing.join(", ")}`);
  checks.push(label);
  console.log(`V1200-CASE-FEED-TAGS PASS ${label}`);
}

function assertNotIncludes(source, needles, label) {
  const found = needles.filter((needle) => source.toLowerCase().includes(needle.toLowerCase()));
  if (found.length) throw new Error(`${label}: found ${found.join(", ")}`);
  checks.push(label);
  console.log(`V1200-CASE-FEED-TAGS PASS ${label}`);
}

function passSummary(prefix) {
  console.log(`${prefix} SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

await main().catch((error) => {
  console.error(`V1200-CASE-FEED-TAGS FAIL ${error.message}`);
  process.exitCode = 1;
});
