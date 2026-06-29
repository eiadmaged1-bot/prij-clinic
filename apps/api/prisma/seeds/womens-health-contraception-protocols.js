const { structuredContent, toTitle, upsertVerifiedProtocol } = require("./verified-protocol-pack-utils");

const contraceptionCodes = [
  ["CONTRACEPTION_COUNSELING", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. MEC and U.S. SPR; FSRH contraception guidance"],
  ["COMBINED_HORMONAL_CONTRACEPTION", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. MEC; FSRH combined hormonal contraception guidance"],
  ["PROGESTIN_ONLY_PILL", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. SPR; FSRH progestogen-only pill guidance"],
  ["INJECTABLE_CONTRACEPTION", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. SPR; FSRH injectable contraception guidance"],
  ["CONTRACEPTIVE_IMPLANT", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. SPR; FSRH implant guidance"],
  ["COPPER_IUD", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. SPR; FSRH intrauterine contraception guidance"],
  ["LNG_IUS", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. SPR; FSRH intrauterine contraception guidance"],
  ["EMERGENCY_CONTRACEPTION", "high", "WHO contraception guidance; CDC U.S. SPR; FSRH emergency contraception guidance"],
  ["POSTPARTUM_CONTRACEPTION", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. MEC; FSRH postpartum contraception guidance"],
  ["POST_ABORTION_CONTRACEPTION", "medium", "WHO abortion care guidance; CDC U.S. SPR; FSRH contraception guidance"],
  ["CONTRACEPTION_WITH_MEDICAL_CONDITIONS", "medium", "WHO Medical Eligibility Criteria for Contraceptive Use; CDC U.S. MEC"],
  ["MISSED_PILLS", "medium", "CDC U.S. SPR; FSRH missed pills guidance"],
  ["IUD_INSERTION_COUNSELING", "medium", "FSRH intrauterine contraception guidance; CDC U.S. SPR"],
  ["IUD_REMOVAL", "medium", "FSRH intrauterine contraception guidance; local clinic protocol placeholder"],
  ["IMPLANT_INSERTION_REMOVAL", "medium", "FSRH implant guidance; local clinic protocol placeholder"],
  ["STERILIZATION_COUNSELING", "medium", "ACOG sterilization counseling guidance; local consent protocol placeholder"],
  ["PRECONCEPTION_COUNSELING", "medium", "ACOG preconception counseling guidance; WHO preconception care guidance"]
];

async function seedContraceptionProtocols(prisma) {
  for (const [code, riskLevel, sourceName] of contraceptionCodes) {
    await upsertVerifiedProtocol(prisma, {
      pack: "contraception",
      code,
      baseCode: code,
      title: `${toTitle(code)} snapshot`,
      specialtyGroup: "Contraception/family planning",
      condition: toTitle(code),
      aliases: ["contraception", "family planning", "eligibility", "counseling"],
      bodySystem: "Reproductive health",
      clinicalArea: "Contraception eligibility and counseling",
      riskLevel,
      sourceName,
      contentJson: structuredContent({
        summary: `${toTitle(code)} eligibility and counseling snapshot for doctor review. It does not select a method automatically.`,
        goals: ["support shared counseling", "check eligibility", "document consent", "protect patient preference"],
        options: [
          "Confirm pregnancy possibility, current goals, and patient preference before discussing options.",
          "Check eligibility using local guidance, medical history, blood pressure, migraine or aura history, thrombotic risk, smoking and age risk, postpartum or lactation status, and drug interactions.",
          "Discuss benefits, limitations, procedure needs, reversibility, bleeding expectations, STI protection limits, and follow-up warning signs in general terms.",
          "For device or procedure workflows, document consent, infection or pregnancy risk check, contraindication review, and clinician-performed procedure decision.",
          "For emergency contraception or missed pills, use source-gated local guidance and clinician judgment without automated dosing."
        ],
        safetyChecks: [
          "Pregnancy possibility check",
          "Contraindications and medical history check",
          "Thrombotic risk, migraine or aura, hypertension, smoking and age risk check",
          "Postpartum and lactation status check",
          "Drug interaction check",
          "STI risk and need for barrier counseling",
          "Patient preference and consent documented",
          "Doctor review required before prescription or procedure"
        ],
        contraindicationChecks: [
          "Do not automatically select a contraceptive method",
          "Do not use for prescribing automation",
          "Verify local eligibility category before doctor decision",
          "Confirm consent before any procedure"
        ],
        redFlags: [
          "Possible pregnancy with concerning symptoms",
          "Severe pelvic pain after device procedure",
          "Fever or infection concern",
          "Severe headache or neurologic symptoms",
          "Chest pain or dyspnea",
          "Heavy bleeding concern"
        ],
        followUpConsiderations: ["Arrange follow-up based on method, symptoms, patient concerns, and local guidance."],
        referralConsiderations: ["Refer when eligibility is complex, procedure risk is high, or urgent symptoms are present."],
        limitations: ["Counseling and eligibility support only.", "No automatic method selection.", "No dose schedules."]
      })
    });
  }
}

module.exports = { seedContraceptionProtocols, contraceptionProtocolCodes: contraceptionCodes.map(([code]) => code) };
