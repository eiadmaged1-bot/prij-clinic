import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const { v152DermatologyTopics } = require("../apps/api/prisma/seeds/v152-dermatology");
const prisma = new PrismaClient();
const workspace = await readFile("apps/web/components/medications/DermatologyWorkspace.tsx", "utf8");
const required = ["Acne", "Hyperpigmentation", "Melasma", "Atopic dermatitis", "Contact dermatitis", "Seborrhoeic dermatitis", "Psoriasis", "Tinea and fungal infection", "Candidal intertrigo", "Rosacea", "Urticaria", "Alopecia", "Hirsutism", "Intertrigo", "Vulvar dermatoses", "Lichen sclerosus", "Lichen planus", "Sensitive-area pigmentation", "Drug eruptions", "Pregnancy-associated dermatoses", "Scabies", "Bacterial skin infection", "Hidradenitis suppurativa"];
assert(v152DermatologyTopics.length >= required.length);
for (const name of required) assert(v152DermatologyTopics.some((topic) => topic.nameEn === name), `missing topic ${name}`);
for (const control of ["Dermatology home", "backToTopics", "previousTopic", "nextTopic", "reset", "topicCategory", "Breadcrumb"]) assert.match(workspace, new RegExp(control));
assert.match(workspace, /\/medications\?query=/);
assert(!/\/prescriptions\?medicationGenericId/.test(workspace), "topic medicine options must open Drug Atlas rather than prescribe");

try {
  const rows = await prisma.dermatologyCondition.findMany({ include: { source: true, genericOptions: { include: { medication: { include: { officialProfile: true } }, source: true } } } });
  assert(rows.length >= 23);
  for (const row of rows) {
    assert.equal(row.reviewStatus, "SOURCE_VERIFIED");
    assert(row.nameAr && !/[ØÙ]{2}/.test(row.nameAr), `${row.stableCode} Arabic name is invalid`);
    assert(row.source?.sourceUrl && row.source.publicationState === "SOURCE_VERIFIED" && row.source.retrievedAt, `${row.stableCode} source provenance missing`);
    const content = row.likelyCategoriesJson;
    for (const field of ["overview", "typicalClinicalPattern", "importantHistoryQuestions", "suggestedExaminationFields", "bodyAreaConsiderations", "relevantInvestigations", "medicationClasses", "pregnancyLactationConsiderations", "sensitiveAreaSafeguards"]) assert(content?.[field] && (typeof content[field] === "string" || content[field].length > 0), `${row.stableCode}.${field} empty`);
    assert(row.differentialJson?.prompts?.length && row.differentialJson?.whenToRefer?.length && row.differentialJson?.relatedTopics?.length);
    assert(Array.isArray(row.redFlagsJson) && row.redFlagsJson.length);
    assert(Array.isArray(row.nonDrugCareJson) && row.nonDrugCareJson.length);
    for (const option of row.genericOptions) assert(option.medication.officialProfile && option.reviewStatus === "SOURCE_VERIFIED" && option.source.publicationState === "SOURCE_VERIFIED");
  }
  const links = rows.reduce((count, row) => count + row.genericOptions.length, 0);
  assert(links > 0);
  console.log(`v1.5.2 Dermatology PASS topics=${rows.length} sourceVerified=${rows.filter((row) => row.reviewStatus === "SOURCE_VERIFIED").length} medicineLinks=${links}`);
} finally { await prisma.$disconnect(); }
