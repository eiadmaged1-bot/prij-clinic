function toTitle(code) {
  return code
    .replace(/_CATALOG_V1$/, "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeAliases(code, extra = []) {
  const title = toTitle(code);
  return Array.from(new Set([title, title.toLowerCase(), code.replaceAll("_", " ").toLowerCase(), ...extra].filter(Boolean))).slice(0, 20);
}

function governanceLimitations(extra = []) {
  return [
    "Draft support only until reviewed and approved by a doctor.",
    "Doctor review required before use in care.",
    "No automatic diagnosis.",
    "No automatic prescribing.",
    "No medication dose automation.",
    "No final treatment plan is generated.",
    "Source requires final clinical governance review before production.",
    ...extra
  ].slice(0, 8);
}

function structuredContent({ summary, goals, options, safetyChecks, contraindicationChecks = [], redFlags = [], followUpConsiderations = [], referralConsiderations = [], limitations = [] }) {
  return {
    summary,
    verifiedManagementAvailable: true,
    goals: goals.slice(0, 8),
    options: options.slice(0, 5),
    safetyChecks: safetyChecks.slice(0, 8),
    contraindicationChecks: contraindicationChecks.slice(0, 8),
    redFlags: redFlags.slice(0, 8),
    followUpConsiderations: followUpConsiderations.slice(0, 8),
    referralConsiderations: referralConsiderations.slice(0, 8),
    limitations: governanceLimitations(limitations)
  };
}

async function upsertVerifiedProtocol(prisma, protocol) {
  const legacyCode = `${protocol.baseCode ?? protocol.code}_CATALOG_V1`;
  const data = {
    code: protocol.code,
    title: protocol.title ?? `${toTitle(protocol.code)} snapshot`,
    specialtyGroup: protocol.specialtyGroup,
    condition: protocol.condition ?? toTitle(protocol.code),
    aliases: safeAliases(protocol.baseCode ?? protocol.code, protocol.aliases ?? []),
    bodySystem: protocol.bodySystem ?? "Gynecology",
    clinicalArea: protocol.clinicalArea ?? protocol.specialtyGroup,
    protocolType: "management_snapshot",
    implementationStatus: "verified",
    riskLevel: protocol.riskLevel,
    sourceName: protocol.sourceName,
    sourceYear: protocol.sourceYear ?? null,
    sourceUrl: protocol.sourceUrl ?? "",
    sourceVersion: protocol.sourceVersion ?? "clinical_governance_review_required",
    contentJson: protocol.contentJson,
    safetyJson: {
      noDoses: true,
      noAutomaticDiagnosis: true,
      noAutomaticPrescribing: true,
      doctorReviewRequired: true,
      externalAi: false,
      clinicalGovernanceReviewRequired: true,
      pack: protocol.pack
    }
  };

  const existing = await prisma.clinicalProtocol.findUnique({ where: { code: protocol.code } });
  if (existing) {
    await prisma.clinicalProtocol.update({ where: { code: protocol.code }, data });
    if (legacyCode !== protocol.code) {
      await prisma.clinicalProtocol.updateMany({
        where: { code: legacyCode, id: { not: existing.id } },
        data: {
          implementationStatus: "retired",
          contentJson: {
            summary: "Retired duplicate catalog entry. Use the verified exact-code protocol.",
            verifiedManagementAvailable: false,
            goals: [],
            options: [],
            safetyChecks: [],
            contraindicationChecks: [],
            redFlags: [],
            followUpConsiderations: [],
            referralConsiderations: [],
            limitations: ["Retired duplicate catalog entry."]
          }
        }
      });
    }
    return;
  }

  const legacy = await prisma.clinicalProtocol.findUnique({ where: { code: legacyCode } });
  if (legacy) {
    await prisma.clinicalProtocol.update({ where: { code: legacyCode }, data });
    return;
  }

  await prisma.clinicalProtocol.create({ data });
}

module.exports = {
  governanceLimitations,
  safeAliases,
  structuredContent,
  toTitle,
  upsertVerifiedProtocol
};
