const RETRIEVED_AT = new Date("2026-07-17T00:00:00.000Z");
const sets = [
  set("V152_FIRST_ANTENATAL", "First antenatal visit candidates", "مرشحات الزيارة الأولى للحمل", "NICE-NG201", "NG201", "https://www.nice.org.uk/guidance/ng201", "Booking appointment and screening sections", ["OBSTETRIC"], ["CBC", "BLOOD_GROUP_RH", "HIV_AG_AB", "HBSAG", "VDRL_RPR", "URINE_CULTURE"]),
  set("V152_TRIMESTER_MONITORING", "Routine trimester review candidates", "مرشحات متابعة الحمل الدورية", "NICE-NG201", "NG201", "https://www.nice.org.uk/guidance/ng201", "Schedule of antenatal appointments", ["OBSTETRIC"], ["CBC", "URINALYSIS"]),
  set("V152_HIGH_RISK", "High-risk pregnancy review candidates", "مرشحات مراجعة الحمل عالي الخطورة", "NICE-NG133", "NG133", "https://www.nice.org.uk/guidance/ng133", "Assessment and monitoring sections", ["HIGH_RISK_OBSTETRIC"], ["CBC", "KIDNEY_FUNCTION_TESTS", "LIVER_FUNCTION_TESTS", "PLATELET_COUNT", "URINALYSIS", "OBSTETRIC_DOPPLER"]),
  set("V152_INFERTILITY", "Initial infertility workup candidates", "مرشحات تقييم تأخر الحمل الأولي", "NICE-NG257", "NG257 (31 March 2026)", "https://www.nice.org.uk/guidance/ng257", "Initial assessment and investigation sections", ["INFERTILITY"], ["FSH", "LH", "PROLACTIN", "TSH", "HYSTEROSALPINGOGRAPHY", "SEMEN_ANALYSIS"]),
  set("V152_PCOS", "PCOS assessment candidates", "مرشحات تقييم تكيس المبايض", "ESHRE-PCOS-2023", "2023", "https://www.eshre.eu/Guidelines%20and%20Legal.aspx", "Polycystic Ovary Syndrome guideline registry entry", ["INFERTILITY", "GYNECOLOGY"], ["TOTAL_TESTOSTERONE", "FREE_TESTOSTERONE", "DHEAS", "HBA1C"]),
  set("V152_RPL", "Recurrent pregnancy loss review candidates", "مرشحات مراجعة فقد الحمل المتكرر", "ESHRE-RPL-2023", "2023", "https://www.eshre.eu/Guidelines%20and%20Legal.aspx", "Recurrent Pregnancy Loss guideline registry entry", ["INFERTILITY", "OBSTETRIC"], ["TSH", "HBA1C", "PELVIC_ULTRASOUND"]),
  set("V152_AUB", "Abnormal uterine bleeding candidates", "مرشحات تقييم النزيف الرحمي", "NICE-NG88", "NG88", "https://www.nice.org.uk/guidance/ng88", "Assessment and investigation sections", ["GYNECOLOGY"], ["CBC", "FERRITIN", "PELVIC_ULTRASOUND"]),
  set("V152_PREOPERATIVE", "Caesarean preoperative candidates", "مرشحات ما قبل الولادة القيصرية", "NICE-NG192", "NG192", "https://www.nice.org.uk/guidance/ng192", "Preoperative preparation section", ["OBSTETRIC"], ["CBC", "BLOOD_GROUP_RH", "COAGULATION_PROFILE"]),
  set("V152_ONCOLOGY_CONCERN", "Gynecologic oncology concern candidates", "مرشحات الاشتباه بأورام النساء", "NICE-NG12", "NG12", "https://www.nice.org.uk/guidance/ng12", "Gynaecological cancer recognition and referral sections", ["GYNECOLOGY", "PREVENTIVE_WELL_WOMAN"], ["PELVIC_ULTRASOUND", "CA_125"]),
  set("V152_INFECTION_STI", "Maternal infection and STI candidates", "مرشحات عدوى الحمل والأمراض المنقولة جنسيا", "WHO-9789240080591", "2nd edition 2025", "https://www.who.int/publications/i/item/9789240080591", "Maternal infections recommendations index", ["OBSTETRIC", "GYNECOLOGY"], ["HIV_AG_AB", "HBSAG", "VDRL_RPR", "CHLAMYDIA_NAAT", "GONORRHEA_NAAT"]),
  set("V152_POSTOPERATIVE", "Postoperative review — clinician selection required", "مراجعة ما بعد الجراحة — يتطلب اختيار الطبيب", "NICE-NG192", "NG192", "https://www.nice.org.uk/guidance/ng192", "Recovery after caesarean birth", ["POSTPARTUM", "OBSTETRIC"], [], false),
  set("V152_MENOPAUSE", "Menopause assessment — no routine test bundle", "تقييم انقطاع الطمث — لا توجد حزمة فحوصات روتينية", "NICE-NG23", "NG23", "https://www.nice.org.uk/guidance/ng23", "Identification and diagnosis sections", ["GYNECOLOGY", "PREVENTIVE_WELL_WOMAN"], [], false)
];

async function seedV152InvestigationSets(prisma) {
  await seedOtherInvestigationFallback(prisma);
  const owner = await prisma.user.findFirst({ where: { status: "active", userRoles: { some: { role: { name: "Owner" } } } }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!owner) throw new Error("An active Owner is required to attribute governed clinic investigation sets.");
  const catalog = await prisma.investigationCatalogItem.findMany({ where: { code: { in: [...new Set(sets.flatMap((item) => item.codes))] }, active: true }, select: { id: true, code: true } });
  const byCode = new Map(catalog.map((item) => [item.code, item.id]));
  const missing = [...new Set(sets.flatMap((item) => item.codes))].filter((code) => !byCode.has(code));
  if (missing.length) throw new Error(`Missing active investigation catalog codes: ${missing.join(", ")}`);
  let created = 0; let updated = 0;
  for (const item of sets) {
    const existing = await prisma.investigationFavoriteSet.findFirst({ where: { sourceIdentifier: item.sourceIdentifier, name: item.name } });
    const data = { userId: owner.id, name: item.name, nameAr: item.nameAr, icon: "investigations", scope: "clinic", branchId: null, defaultVisitType: null, active: true, publicationState: "SOURCE_VERIFIED_REFERENCE", sourceIdentifier: item.sourceIdentifier, sourceUrl: item.sourceUrl, sourceVersion: item.sourceVersion, sourceSection: item.sourceSection, sourceRetrievedAt: RETRIEVED_AT, version: 1, patientTypesJson: item.patientTypes, guidanceText: item.actionable ? "Optional source-linked candidates only. Applying this set fills the basket; Doctor review and separate confirmation are required." : "The source does not support a universal routine bundle here. Select investigations individually after assessment.", actionable: item.actionable };
    const target = existing ? await prisma.investigationFavoriteSet.update({ where: { id: existing.id }, data }) : await prisma.investigationFavoriteSet.create({ data });
    existing ? updated += 1 : created += 1;
    await prisma.investigationFavoriteSetItem.deleteMany({ where: { favoriteSetId: target.id } });
    if (item.codes.length) await prisma.investigationFavoriteSetItem.createMany({ data: item.codes.map((code, position) => ({ favoriteSetId: target.id, investigationCatalogItemId: byCode.get(code), position, required: false, rationale: `${item.sourceIdentifier} · ${item.sourceSection} · optional candidate; Doctor confirmation required.`, responsibilityJson: { ordering: "doctor_confirmation_required", followUp: "assign_at_order_review" } })) });
  }
  return { target: sets.length, created, updated, ownerAttribution: "existing_active_owner", missingCatalogCodes: missing.length };
}

async function seedOtherInvestigationFallback(prisma) {
  const sharedData = {
    name: "Other Investigation — Specify",
    normalizedName: "other investigation specify",
    category: "Other",
    subcategory: "Doctor-Specified Request",
    clinicalGroup: "Doctor-Specified Request",
    aliasesJson: ["other test", "custom investigation", "فحص آخر", "تحليل آخر"],
    keywordsJson: ["other investigation", "custom test", "doctor specified", "فحص آخر", "تحليل آخر"],
    tagsJson: ["Other", "Doctor-Specified Request"],
    discipline: "Other",
    modality: "Doctor-specified",
    sampleType: null,
    specialty: "Obstetrics and Gynecology",
    sortOrder: 99990
  };
  await prisma.investigationCatalogItem.upsert({
    where: { code: "OTHER_INVESTIGATION_SPECIFY" },
    update: sharedData,
    create: { code: "OTHER_INVESTIGATION_SPECIFY", ...sharedData, active: true }
  });
}

function set(stableCode, name, nameAr, sourceIdentifier, sourceVersion, sourceUrl, sourceSection, patientTypes, codes, actionable = true) { return { stableCode, name, nameAr, sourceIdentifier, sourceVersion, sourceUrl, sourceSection, patientTypes, codes, actionable }; }
module.exports = { seedV152InvestigationSets, v152InvestigationSets: sets };
