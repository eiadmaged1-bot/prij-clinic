import { PrismaClient } from "@prisma/client";
import { emergencyProtocolCodes } from "../apps/api/prisma/seeds/womens-health-emergency-protocols.js";
import { aubMenstrualProtocolCodes } from "../apps/api/prisma/seeds/womens-health-aub-menstrual-protocols.js";
import { contraceptionProtocolCodes } from "../apps/api/prisma/seeds/womens-health-contraception-protocols.js";
import { antenatalRoutineProtocolCodes } from "../apps/api/prisma/seeds/womens-health-antenatal-routine-protocols.js";

const prisma = new PrismaClient();
const failures = [];
const passes = [];

const packs = [
  ["emergency", emergencyProtocolCodes],
  ["aub", aubMenstrualProtocolCodes],
  ["contraception", contraceptionProtocolCodes],
  ["antenatal", antenatalRoutineProtocolCodes]
];

const prohibited = [
  /\b\d+(\.\d+)?\s*(mg|mcg|g|gram|grams|ml|iu|units?|tabs?|tablets?|caps?|capsules?)\b/i,
  /\b(must|should)\s+prescribe\b/i,
  /\b(automatically prescribe|prescribe automatically|start medication|start treatment)\b/i,
  /\bdefinitive diagnosis\b/i,
  /\b(final diagnosis|diagnosis is|diagnose as|confirms diagnosis)\b/i,
  /\bfinal treatment plan\s*:/i,
  /\bsend home\b/i,
  /\breassur(e|ed|ance)\b/i,
  /\bguaranteed\b/i,
  /\balways\b/i
];

function pass(message) {
  passes.push(message);
  console.log(`PROTOCOL-PACKS PASS ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`PROTOCOL-PACKS FAIL ${message}`);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function flatten(content) {
  return [
    content?.summary,
    ...list(content?.goals),
    ...list(content?.options),
    ...list(content?.safetyChecks),
    ...list(content?.contraindicationChecks),
    ...list(content?.redFlags),
    ...list(content?.followUpConsiderations),
    ...list(content?.referralConsiderations),
    ...list(content?.limitations)
  ].filter(Boolean).join("\n");
}

try {
  const beforeVerifiedCount = 3;
  const expectedAddedCount = packs.reduce((sum, [, codes]) => sum + codes.length, 0);
  const verifiedCount = await prisma.clinicalProtocol.count({ where: { implementationStatus: "verified" } });
  if (verifiedCount >= beforeVerifiedCount + expectedAddedCount) pass(`verified protocol count is ${verifiedCount}`);
  else fail(`verified protocol count ${verifiedCount} is below expected ${beforeVerifiedCount + expectedAddedCount}`);

  for (const [packName, codes] of packs) {
    const rows = await prisma.clinicalProtocol.findMany({ where: { code: { in: codes } }, orderBy: { code: "asc" } });
    if (rows.length === codes.length) pass(`${packName} pack exact codes exist`);
    else fail(`${packName} pack expected ${codes.length} codes and found ${rows.length}`);

    for (const row of rows) {
      const content = row.contentJson ?? {};
      const text = flatten(content);
      if (row.implementationStatus !== "verified") fail(`${row.code} is not verified`);
      if (!row.sourceName?.trim()) fail(`${row.code} missing sourceName`);
      if (!["low", "medium", "high", "emergency"].includes(row.riskLevel)) fail(`${row.code} has invalid riskLevel ${row.riskLevel}`);
      if (content.verifiedManagementAvailable !== true) fail(`${row.code} does not mark verified management available`);
      if (!content.summary?.trim()) fail(`${row.code} missing summary`);
      if (list(content.options).length < 1 || list(content.options).length > 5) fail(`${row.code} has invalid option count`);
      if (list(content.safetyChecks).length < 1 || list(content.safetyChecks).length > 8) fail(`${row.code} has invalid safety check count`);
      if (list(content.limitations).length < 1) fail(`${row.code} missing limitations`);
      if (!/doctor review required|reviewed and approved by a doctor|reviewed by a doctor/i.test(text)) fail(`${row.code} missing doctor review wording`);
      if (!/Source requires final clinical governance review before production/i.test(text)) fail(`${row.code} missing governance limitation`);
      for (const pattern of prohibited) {
        if (pattern.test(text)) fail(`${row.code} includes prohibited wording: ${pattern}`);
      }
      if (row.safetyJson?.externalAi !== false) fail(`${row.code} does not explicitly block external AI`);
    }
    pass(`${packName} pack structured validation complete`);
  }
} finally {
  await prisma.$disconnect();
}

console.log(`PROTOCOL-PACKS SUMMARY PASS ${passes.length} FAIL ${failures.length}`);
if (failures.length) process.exit(1);
