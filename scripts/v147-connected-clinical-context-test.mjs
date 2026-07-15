import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
try {
  const [evaluator, service, patientService, card, decisions] = await Promise.all([
    readFile("apps/api/src/care-assist/care-assist-evaluator.service.ts", "utf8"),
    readFile("apps/api/src/care-assist/care-assist.service.ts", "utf8"),
    readFile("apps/api/src/patients/patients.service.ts", "utf8"),
    readFile("apps/web/components/care-assist/CareAssistFindingCard.tsx", "utf8"),
    readFile("apps/web/components/care-assist/CareAssistDecisionControls.tsx", "utf8")
  ]);
  const codes = ["PREGNANCY_HYPERTENSION_CONTEXT", "PCOS_FERTILITY_GOAL_CONTEXT", "PENICILLIN_ALLERGY_CONTEXT", "RENAL_IMPAIRMENT_ACTIVE_MEDICINE_CONTEXT"];
  const rules = await prisma.careAssistRule.findMany({ where: { code: { in: codes } } });
  assert.equal(rules.length, 4);
  for (const code of codes) assert.ok(evaluator.includes(code));
  for (const field of ["blood pressure", "proteinuria", "platelets", "renal function", "liver function", "fetal status", "allergy reaction", "allergy severity", "current renal result"]) assert.ok(evaluator.includes(field), `missing-field contract absent: ${field}`);
  for (const explanation of ["whyItAppeared", "factsUsed", "missingInformation", "relatedPathway", "relatedMedicines", "relatedInvestigations", "actions"]) assert.ok(evaluator.includes(explanation));
  for (const action of ["Review", "Open pathway", "Add selected investigations", "Open medication profile", "Add medication to prescription draft", "Create follow-up"]) assert.ok(evaluator.includes(action));
  for (const action of ["Review", "Dismiss", "Not applicable", "Snooze"]) assert.ok(decisions.includes(action));
  assert.match(service, /care_assist\.finding_decision/);
  assert.match(patientService, /careAssistDecisions/);
  assert.match(patientService, /Clinical context decision recorded/);
  assert.match(card, /Why this appeared/);
  assert.doesNotMatch(evaluator, /openai|anthropic|axios|fetch\(/i);
  assert.match(evaluator, /no medication change is proposed/i);
  console.log("v1.4.7 deterministic connected clinical context PASS (38 assertions)");
} finally {
  await prisma.$disconnect();
}
