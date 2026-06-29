const { structuredContent, toTitle, upsertVerifiedProtocol } = require("./verified-protocol-pack-utils");

const emergencyCodes = [
  ["ECTOPIC_RED_FLAGS", "emergency", "NICE ectopic pregnancy and miscarriage guidance; RCOG early pregnancy safety guidance"],
  ["RUPTURED_ECTOPIC_SUSPECTED", "emergency", "NICE ectopic pregnancy and miscarriage guidance; local emergency protocol placeholder"],
  ["OVARIAN_TORSION_SUSPECTED", "emergency", "ACOG adnexal torsion guidance; local emergency protocol placeholder"],
  ["ACUTE_ABDOMEN_GYNECOLOGY", "emergency", "Local emergency protocol placeholder; ACOG acute pelvic pain guidance where applicable"],
  ["SEPSIS_RED_FLAGS", "emergency", "WHO maternal sepsis guidance; local emergency protocol placeholder"],
  ["PREECLAMPSIA_RED_FLAGS", "emergency", "NICE hypertension in pregnancy guideline; ACOG hypertensive disorders guidance"],
  ["SEVERE_HEADACHE_PREGNANCY_POSTPARTUM", "high", "NICE hypertension in pregnancy guideline; local emergency protocol placeholder"],
  ["CHEST_PAIN_DYSPNEA_PREGNANCY_POSTPARTUM", "emergency", "RCOG maternal collapse and VTE guidance; local emergency protocol placeholder"],
  ["VAGINAL_BLEEDING_PREGNANCY_URGENT", "emergency", "RCOG bleeding in pregnancy guidance; local emergency protocol placeholder"],
  ["REDUCED_FETAL_MOVEMENT_URGENT", "high", "RCOG reduced fetal movements guidance; local obstetric protocol placeholder"],
  ["POSTPARTUM_HEMORRHAGE_RED_FLAGS", "emergency", "RCOG postpartum hemorrhage guidance; local emergency protocol placeholder"],
  ["EARLY_PREGNANCY_ASSESSMENT", "high", "NICE ectopic pregnancy and miscarriage guidance"],
  ["PREGNANCY_OF_UNKNOWN_LOCATION", "high", "NICE ectopic pregnancy and miscarriage guidance; local early pregnancy protocol placeholder"],
  ["ECTOPIC_PREGNANCY", "high", "NICE ectopic pregnancy and miscarriage guidance"],
  ["FIRST_TRIMESTER_BLEEDING", "high", "NICE ectopic pregnancy and miscarriage guidance"],
  ["MISCARRIAGE_THREATENED", "medium", "NICE ectopic pregnancy and miscarriage guidance"],
  ["MISCARRIAGE_INCOMPLETE", "high", "NICE ectopic pregnancy and miscarriage guidance"],
  ["MISSED_MISCARRIAGE", "medium", "NICE ectopic pregnancy and miscarriage guidance"],
  ["SEPTIC_MISCARRIAGE", "emergency", "WHO abortion care guidance; local emergency protocol placeholder"],
  ["MOLAR_PREGNANCY", "high", "RCOG gestational trophoblastic disease guidance; local referral protocol placeholder"]
];

async function seedEmergencyObProtocols(prisma) {
  for (const [code, riskLevel, sourceName] of emergencyCodes) {
    const title = `${toTitle(code)} snapshot`;
    await upsertVerifiedProtocol(prisma, {
      pack: "emergency_ob_early_pregnancy",
      code,
      baseCode: code,
      title,
      specialtyGroup: code.includes("MISCARRIAGE") || code.includes("ECTOPIC") || code.includes("PREGNANCY_OF_UNKNOWN") || code.includes("FIRST_TRIMESTER") || code.includes("MOLAR") || code.includes("EARLY_PREGNANCY")
        ? "Early pregnancy"
        : "Emergency red flags",
      condition: toTitle(code),
      aliases: ["urgent review", "red flag", "early pregnancy urgent", "obstetric emergency"],
      bodySystem: "Obstetrics and gynecology",
      clinicalArea: "Emergency and early pregnancy safety",
      riskLevel,
      sourceName,
      contentJson: structuredContent({
        summary: `${toTitle(code)} doctor-facing urgent safety snapshot. Immediate clinician review required. This is not a diagnosis.`,
        goals: ["recognize urgent safety concern", "support immediate clinician review", "document doctor assessment"],
        options: [
          "Assess immediately and document the doctor-entered concern.",
          "Escalate according to local emergency protocol and available senior clinical support.",
          "Check maternal observations, pregnancy status, bleeding or pain context, and stability as clinically appropriate.",
          "Arrange urgent referral or transfer when local capability is not suitable.",
          "Use this snapshot only as a prompt for human clinician review."
        ],
        safetyChecks: [
          "Immediate clinician review required",
          "Assess airway, breathing, circulation, pain, bleeding, fever, blood pressure, and consciousness as relevant",
          "Confirm pregnancy or postpartum context where relevant",
          "Check for hemodynamic concern or rapidly worsening symptoms",
          "Review allergies, comorbidities, anticoagulants, and current medicines",
          "Escalate according to local emergency protocol",
          "This does not replace emergency clinical assessment",
          "Document doctor decision and communication"
        ],
        contraindicationChecks: [
          "Do not delay emergency assessment for protocol matching",
          "Do not use as a diagnostic conclusion or treatment directive",
          "Do not use for prescribing automation"
        ],
        redFlags: [
          "Collapse or hemodynamic concern",
          "Severe or worsening pain",
          "Heavy bleeding or shock concern",
          "Fever or sepsis concern",
          "Neurologic symptoms or severe headache in pregnancy or postpartum",
          "Chest pain, dyspnea, or reduced fetal movement concern"
        ],
        followUpConsiderations: ["Follow local emergency protocol after senior clinician assessment."],
        referralConsiderations: ["Urgent emergency, obstetric, gynecology, anesthesia, medical, or fetal assessment referral as clinically indicated."],
        limitations: ["Follow local emergency protocol.", "This does not replace emergency clinical assessment."]
      })
    });
  }
}

module.exports = { seedEmergencyObProtocols, emergencyProtocolCodes: emergencyCodes.map(([code]) => code) };
