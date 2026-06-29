const { structuredContent, toTitle, upsertVerifiedProtocol } = require("./verified-protocol-pack-utils");

const aubCodes = [
  ["ABNORMAL_UTERINE_BLEEDING", "medium", "NICE heavy menstrual bleeding guideline; FIGO PALM-COEIN terminology; ACOG abnormal uterine bleeding guidance"],
  ["HEAVY_MENSTRUAL_BLEEDING", "medium", "NICE heavy menstrual bleeding guideline; ACOG abnormal uterine bleeding guidance"],
  ["INTERMENSTRUAL_BLEEDING", "medium", "NICE suspected cancer referral guidance where applicable; local clinic protocol placeholder"],
  ["POSTCOITAL_BLEEDING", "high", "NICE suspected cancer referral guidance where applicable; local clinic protocol placeholder"],
  ["POSTMENOPAUSAL_BLEEDING", "high", "NICE suspected cancer referral guidance for postmenopausal bleeding; local clinic protocol placeholder"],
  ["PRIMARY_AMENORRHEA", "medium", "ACOG menstrual disorders guidance; local clinic protocol placeholder"],
  ["SECONDARY_AMENORRHEA", "medium", "ACOG menstrual disorders guidance; local clinic protocol placeholder"],
  ["OLIGOMENORRHEA", "medium", "ACOG menstrual disorders guidance; local clinic protocol placeholder"],
  ["POLYMENORRHEA", "medium", "FIGO menstrual bleeding terminology; local clinic protocol placeholder"],
  ["DYSMENORRHEA_PRIMARY", "medium", "ACOG dysmenorrhea guidance; local clinic protocol placeholder"],
  ["DYSMENORRHEA_SECONDARY", "medium", "ACOG dysmenorrhea and endometriosis guidance; local clinic protocol placeholder"],
  ["PMS", "low", "RCOG premenstrual syndrome guidance; local clinic protocol placeholder"],
  ["PMDD", "medium", "RCOG premenstrual syndrome guidance; local clinic protocol placeholder"],
  ["ADOLESCENT_MENSTRUAL_DISORDERS", "medium", "ACOG adolescent menstrual disorders guidance; local clinic protocol placeholder"],
  ["ANOVULATORY_BLEEDING", "medium", "FIGO PALM-COEIN terminology; ACOG abnormal uterine bleeding guidance"],
  ["COAGULOPATHY_RELATED_HEAVY_BLEEDING", "high", "ACOG adolescent heavy menstrual bleeding guidance; local hematology referral protocol placeholder"],
  ["IATROGENIC_ABNORMAL_BLEEDING", "medium", "FIGO PALM-COEIN terminology; local clinic protocol placeholder"]
];

async function seedAubMenstrualProtocols(prisma) {
  for (const [code, riskLevel, sourceName] of aubCodes) {
    await upsertVerifiedProtocol(prisma, {
      pack: "aub_menstrual",
      code,
      baseCode: code,
      title: `${toTitle(code)} snapshot`,
      specialtyGroup: "General gynecology and menstrual disorders",
      condition: toTitle(code),
      aliases: ["AUB", "menstrual disorder", "bleeding pattern", "cycle concern"],
      bodySystem: "Gynecology",
      clinicalArea: "AUB and menstrual disorders",
      riskLevel,
      sourceName,
      contentJson: structuredContent({
        summary: `${toTitle(code)} doctor-reviewed gynecology management snapshot. This is not a diagnosis and does not create a final plan.`,
        goals: ["clarify bleeding pattern", "identify urgent red flags", "support documentation", "guide doctor-reviewed next steps"],
        options: [
          "Confirm pregnancy possibility and document the doctor-entered bleeding pattern or cycle concern.",
          "Consider structural, ovulatory, endometrial, iatrogenic, and systemic contributors using clinician judgment.",
          "Document examination, investigation, imaging, or sampling decisions made by the doctor.",
          "Use referral or urgent pathway for postmenopausal bleeding, suspected malignancy, severe pain, hemodynamic concern, or heavy acute bleeding.",
          "Individualize counseling and follow-up to age, fertility goals, comorbidities, preferences, and local guidance."
        ],
        safetyChecks: [
          "Pregnancy test consideration where relevant",
          "Check hemodynamic concern, severe pain, fever, syncope, or heavy acute bleeding",
          "Review postmenopausal, postcoital, or persistent intermenstrual bleeding concern",
          "Review anemia symptoms and bleeding impact",
          "Check anticoagulants, hormonal medicines, devices, and comorbidities",
          "Check malignancy risk factors and cervical screening status where relevant",
          "Doctor review required before treatment choices",
          "Document consent and follow-up plan"
        ],
        contraindicationChecks: [
          "Do not automatically select hormonal treatment",
          "Do not use for automatic prescribing",
          "Check contraindications before any doctor-chosen medicine or procedure"
        ],
        redFlags: [
          "Hemodynamic concern or heavy acute bleeding",
          "Postmenopausal bleeding",
          "Suspected malignancy",
          "Severe pelvic pain",
          "Fever or sepsis concern",
          "Positive pregnancy test with pain or bleeding"
        ],
        followUpConsiderations: ["Review symptoms, investigations, anemia status, and patient priorities."],
        referralConsiderations: ["Urgent gynecology or oncology pathway when red flags or suspected malignancy are present."],
        limitations: ["Short original summary only.", "Use local guideline and governance review before production."]
      })
    });
  }
}

module.exports = { seedAubMenstrualProtocols, aubMenstrualProtocolCodes: aubCodes.map(([code]) => code) };
