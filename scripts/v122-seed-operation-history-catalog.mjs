import { codeFromName, createPrisma, normalizeName } from "./v121-reference-utils.mjs";

const prisma = createPrisma();

const operations = [
  ["Cesarean section", "OB/GYN operations", "OB/GYN", "Reproductive system", true, ["CS", "C-section"]],
  ["Vaginal delivery with episiotomy repair", "OB/GYN operations", "OB/GYN", "Reproductive system", true, ["episiotomy repair"]],
  ["Dilatation and curettage", "OB/GYN operations", "OB/GYN", "Uterus", true, ["D&C"]],
  ["Evacuation of retained products of conception", "OB/GYN operations", "OB/GYN", "Uterus", true, ["ERPC"]],
  ["Manual vacuum aspiration", "OB/GYN operations", "OB/GYN", "Uterus", true, ["MVA"]],
  ["Diagnostic hysteroscopy", "OB/GYN operations", "OB/GYN", "Uterus", true, ["hysteroscopy diagnostic"]],
  ["Hysteroscopic polypectomy", "OB/GYN operations", "OB/GYN", "Uterus", true, ["polypectomy"]],
  ["Hysteroscopic myomectomy", "OB/GYN operations", "OB/GYN", "Uterus", true, ["fibroid resection"]],
  ["Diagnostic laparoscopy", "OB/GYN operations", "OB/GYN", "Pelvis", true, ["laparoscopy diagnostic"]],
  ["Laparoscopic ovarian cystectomy", "OB/GYN operations", "OB/GYN", "Ovary", true, ["ovarian cystectomy"]],
  ["Laparoscopic salpingectomy", "OB/GYN operations", "OB/GYN", "Fallopian tube", true, ["salpingectomy"]],
  ["Laparoscopic salpingostomy", "OB/GYN operations", "OB/GYN", "Fallopian tube", true, ["salpingostomy"]],
  ["Laparoscopic adhesiolysis", "OB/GYN operations", "OB/GYN", "Pelvis", true, ["adhesiolysis"]],
  ["Laparoscopic endometriosis excision", "OB/GYN operations", "OB/GYN", "Pelvis", true, ["endometriosis surgery"]],
  ["Myomectomy", "OB/GYN operations", "OB/GYN", "Uterus", true, ["fibroid surgery"]],
  ["Abdominal hysterectomy", "OB/GYN operations", "OB/GYN", "Uterus", true, ["TAH"]],
  ["Vaginal hysterectomy", "OB/GYN operations", "OB/GYN", "Uterus", true, ["VH"]],
  ["Laparoscopic hysterectomy", "OB/GYN operations", "OB/GYN", "Uterus", true, ["TLH"]],
  ["Oophorectomy", "OB/GYN operations", "OB/GYN", "Ovary", true, ["ovary removal"]],
  ["Salpingo-oophorectomy", "OB/GYN operations", "OB/GYN", "Ovary/Fallopian tube", true, ["BSO", "SO"]],
  ["Tubal ligation", "OB/GYN operations", "OB/GYN", "Fallopian tube", true, ["sterilization"]],
  ["Cervical cerclage", "OB/GYN operations", "OB/GYN", "Cervix", true, ["cerclage"]],
  ["LEEP / LLETZ", "OB/GYN operations", "OB/GYN", "Cervix", true, ["LEEP", "LLETZ"]],
  ["Cervical biopsy", "OB/GYN operations", "OB/GYN", "Cervix", true, ["cervix biopsy"]],
  ["Endometrial biopsy", "OB/GYN operations", "OB/GYN", "Uterus", true, ["EMB"]],
  ["Vulvar biopsy", "OB/GYN operations", "OB/GYN", "Vulva", true, ["vulva biopsy"]],
  ["Bartholin cyst marsupialization", "OB/GYN operations", "OB/GYN", "Vulva", true, ["Bartholin marsupialization"]],
  ["Ectopic pregnancy surgery", "OB/GYN operations", "OB/GYN", "Fallopian tube", true, ["ectopic surgery"]],
  ["Ovarian drilling", "OB/GYN operations", "OB/GYN", "Ovary", true, ["PCOS ovarian drilling"]],
  ["Pelvic floor repair", "OB/GYN operations", "OB/GYN", "Pelvic floor", true, ["anterior repair", "posterior repair", "colporrhaphy"]],
  ["Appendectomy", "General surgical history", "General surgery", "Gastrointestinal", false, ["appendicectomy"]],
  ["Cholecystectomy", "General surgical history", "General surgery", "Hepatobiliary", false, ["gallbladder removal"]],
  ["Hernia repair", "General surgical history", "General surgery", "Abdominal wall", false, ["herniorrhaphy"]],
  ["Thyroidectomy", "General surgical history", "General surgery", "Endocrine", false, ["thyroid surgery"]],
  ["Breast lumpectomy", "General surgical history", "Breast surgery", "Breast", false, ["wide local excision"]],
  ["Mastectomy", "General surgical history", "Breast surgery", "Breast", false, ["breast removal"]],
  ["Bariatric surgery", "General surgical history", "General surgery", "Gastrointestinal", false, ["weight loss surgery"]],
  ["Sleeve gastrectomy", "General surgical history", "General surgery", "Gastrointestinal", false, ["gastric sleeve"]],
  ["Gastric bypass", "General surgical history", "General surgery", "Gastrointestinal", false, ["bypass surgery"]],
  ["Laparotomy", "General surgical history", "General surgery", "Abdomen", false, ["open abdominal surgery"]],
  ["Exploratory laparotomy", "General surgical history", "General surgery", "Abdomen", false, ["ex lap"]],
  ["Orthopedic fracture fixation", "General surgical history", "Orthopedics", "Musculoskeletal", false, ["ORIF"]],
  ["Spinal surgery", "General surgical history", "Orthopedics", "Spine", false, ["spine operation"]],
  ["Cardiac catheterization", "General surgical history", "Cardiology", "Cardiovascular", false, ["coronary angiography"]],
  ["Coronary artery bypass grafting", "General surgical history", "Cardiac surgery", "Cardiovascular", false, ["CABG"]],
  ["Cataract surgery", "General surgical history", "Ophthalmology", "Eye", false, ["phacoemulsification"]],
  ["Tonsillectomy", "General surgical history", "ENT", "ENT", false, ["tonsil removal"]],
  ["Septoplasty", "General surgical history", "ENT", "Nose", false, ["nasal septum surgery"]]
];

try {
  for (const [name, category, specialty, bodySystem, isObGyn, aliases] of operations) {
    await prisma.operationCatalogItem.upsert({
      where: { normalizedName: normalizeName(name) },
      update: { name, category, specialty, bodySystem, isObGyn, isSurgical: true, aliases, sourceType: "curated_reference", reviewStatus: "reviewed", isActive: true },
      create: { code: codeFromName("OP", name), name, normalizedName: normalizeName(name), category, specialty, bodySystem, isObGyn, isSurgical: true, aliases, sourceType: "curated_reference", reviewStatus: "reviewed", isActive: true }
    });
  }
  const count = await prisma.operationCatalogItem.count();
  console.log(`V122-SEED-OPERATIONS PASS upserted=${operations.length} total=${count}`);
} finally {
  await prisma.$disconnect();
}
