const { structuredContent, toTitle, upsertVerifiedProtocol } = require("./verified-protocol-pack-utils");

const antenatalCodes = [
  ["ANTENATAL_CARE_ROUTINE", "medium", "NICE antenatal care guideline; WHO antenatal care recommendations; local clinic protocol placeholder"],
  ["PREGNANCY_DATING", "medium", "NICE antenatal care guideline; ACOG prenatal care guidance"],
  ["ANTENATAL_SCREENING", "medium", "NICE antenatal care guideline; WHO antenatal care recommendations"],
  ["ANEMIA_IN_PREGNANCY", "medium", "WHO antenatal care recommendations; NICE antenatal care guideline"],
  ["NAUSEA_VOMITING_PREGNANCY", "medium", "RCOG nausea and vomiting in pregnancy guidance; local clinic protocol placeholder"],
  ["HEARTBURN_PREGNANCY", "low", "NICE antenatal care guideline; local clinic protocol placeholder"],
  ["CONSTIPATION_PREGNANCY", "low", "NICE antenatal care guideline; local clinic protocol placeholder"],
  ["BACK_PAIN_PREGNANCY", "low", "NICE antenatal care guideline; local clinic protocol placeholder"],
  ["VARICOSE_VEINS_PREGNANCY", "low", "NICE antenatal care guideline; local clinic protocol placeholder"],
  ["VACCINATION_IN_PREGNANCY", "medium", "WHO antenatal care recommendations; ACOG prenatal care guidance; local vaccination protocol placeholder"],
  ["NUTRITION_IN_PREGNANCY", "low", "WHO antenatal care recommendations; NICE antenatal care guideline"],
  ["EXERCISE_IN_PREGNANCY", "low", "ACOG physical activity in pregnancy guidance; local clinic protocol placeholder"],
  ["TRAVEL_IN_PREGNANCY", "medium", "ACOG travel during pregnancy guidance; local clinic protocol placeholder"],
  ["MEDICATION_REVIEW_IN_PREGNANCY", "medium", "ACOG prenatal care guidance; local medication safety protocol placeholder"],
  ["MATERNAL_MENTAL_HEALTH_SCREENING", "high", "NICE antenatal and postnatal mental health guidance; local safety protocol placeholder"],
  ["DOMESTIC_VIOLENCE_SCREENING_PREGNANCY", "high", "WHO violence against women clinical guidance; local safeguarding protocol placeholder"]
];

async function seedAntenatalRoutineProtocols(prisma) {
  for (const [code, riskLevel, sourceName] of antenatalCodes) {
    await upsertVerifiedProtocol(prisma, {
      pack: "antenatal_routine",
      code,
      baseCode: code,
      title: `${toTitle(code)} snapshot`,
      specialtyGroup: "Antenatal care",
      condition: toTitle(code),
      aliases: ["antenatal", "prenatal", "routine pregnancy care", "pregnancy visit"],
      bodySystem: "Obstetrics",
      clinicalArea: "Routine antenatal care",
      riskLevel,
      sourceName,
      contentJson: structuredContent({
        summary: `${toTitle(code)} routine antenatal care support snapshot for doctor review. It does not diagnose or approve medicines automatically.`,
        goals: ["support routine visit documentation", "check safety red flags", "record dating and screening context", "support doctor-reviewed counseling"],
        options: [
          "Document gestational age, dating method, EDD source, symptoms, observations, and patient concerns.",
          "Review routine screening, vaccination, lifestyle, nutrition, medication safety, and follow-up reminders according to local guidance.",
          "Check urgent symptoms and pregnancy-specific red flags before routine counseling.",
          "For medication review, verify pregnancy and lactation safety through approved clinical sources before any doctor decision.",
          "Use referral or urgent pathway for red flags, mental health safety concern, domestic violence concern, or complex risk factors."
        ],
        safetyChecks: [
          "EDD and dating method documented",
          "Blood pressure, bleeding, pain, fetal movement context, fever, headache, dyspnea, and swelling reviewed where relevant",
          "Screening and vaccination status reviewed according to local schedule",
          "Medication and allergy review completed",
          "Mental health and safeguarding concerns require human clinician review",
          "Domestic violence concern uses safe local safeguarding pathway",
          "Doctor review required before clinical decisions",
          "No automatic medicine approval"
        ],
        contraindicationChecks: [
          "Do not approve medicines automatically",
          "Do not use as a final antenatal plan",
          "Verify pregnancy or lactation safety before doctor decision",
          "Use safe human review for mental health or violence concerns"
        ],
        redFlags: [
          "Bleeding, severe pain, fever, or sepsis concern",
          "Severe headache, visual symptoms, chest pain, or dyspnea",
          "Reduced fetal movement concern",
          "Hypertension or preeclampsia concern",
          "Mental health safety concern",
          "Domestic violence or safeguarding concern"
        ],
        followUpConsiderations: ["Plan follow-up interval and investigations according to doctor decision and local antenatal schedule."],
        referralConsiderations: ["Refer urgently for red flags, safeguarding concern, severe symptoms, or high-risk pregnancy needs."],
        limitations: ["Routine antenatal support only.", "No graphic details.", "Human clinician review required for safety concerns."]
      })
    });
  }
}

module.exports = { seedAntenatalRoutineProtocols, antenatalRoutineProtocolCodes: antenatalCodes.map(([code]) => code) };
