import { codeFromName, createPrisma, normalizeName } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const operations = [
  ["Cesarean section", "OB/GYN operations", "OB/GYN", "Reproductive system", true],
  ["Vaginal delivery with episiotomy repair", "OB/GYN operations", "OB/GYN", "Reproductive system", true],
  ["Dilatation and curettage", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Evacuation of retained products of conception", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Manual vacuum aspiration", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Hysteroscopy diagnostic", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Hysteroscopic polypectomy", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Hysteroscopic myomectomy", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Laparoscopy diagnostic", "OB/GYN operations", "OB/GYN", "Pelvis", true],
  ["Laparoscopic ovarian cystectomy", "OB/GYN operations", "OB/GYN", "Ovary", true],
  ["Laparoscopic salpingectomy", "OB/GYN operations", "OB/GYN", "Fallopian tube", true],
  ["Laparoscopic salpingostomy", "OB/GYN operations", "OB/GYN", "Fallopian tube", true],
  ["Laparoscopic adhesiolysis", "OB/GYN operations", "OB/GYN", "Pelvis", true],
  ["Laparoscopic endometriosis excision", "OB/GYN operations", "OB/GYN", "Pelvis", true],
  ["Myomectomy", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Abdominal hysterectomy", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Vaginal hysterectomy", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Laparoscopic hysterectomy", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Oophorectomy", "OB/GYN operations", "OB/GYN", "Ovary", true],
  ["Salpingo-oophorectomy", "OB/GYN operations", "OB/GYN", "Ovary/Fallopian tube", true],
  ["Tubal ligation", "OB/GYN operations", "OB/GYN", "Fallopian tube", true],
  ["Cervical cerclage", "OB/GYN operations", "OB/GYN", "Cervix", true],
  ["LEEP / LLETZ", "OB/GYN operations", "OB/GYN", "Cervix", true],
  ["Cervical biopsy", "OB/GYN operations", "OB/GYN", "Cervix", true],
  ["Endometrial biopsy", "OB/GYN operations", "OB/GYN", "Uterus", true],
  ["Vulvar biopsy", "OB/GYN operations", "OB/GYN", "Vulva", true],
  ["Bartholin cyst marsupialization", "OB/GYN operations", "OB/GYN", "Vulva", true],
  ["Ectopic pregnancy surgery", "OB/GYN operations", "OB/GYN", "Fallopian tube", true],
  ["Ovarian drilling", "OB/GYN operations", "OB/GYN", "Ovary", true],
  ["Colporrhaphy anterior repair", "OB/GYN operations", "OB/GYN", "Pelvic floor", true],
  ["Colporrhaphy posterior repair", "OB/GYN operations", "OB/GYN", "Pelvic floor", true],
  ["Pelvic floor repair", "OB/GYN operations", "OB/GYN", "Pelvic floor", true],
  ["Appendectomy", "General surgical history", "General surgery", "Gastrointestinal", false],
  ["Cholecystectomy", "General surgical history", "General surgery", "Hepatobiliary", false],
  ["Hernia repair", "General surgical history", "General surgery", "Abdominal wall", false],
  ["Tonsillectomy", "General surgical history", "ENT", "ENT", false],
  ["Thyroidectomy", "General surgical history", "General surgery", "Endocrine", false],
  ["Mastectomy", "General surgical history", "Breast surgery", "Breast", false],
  ["Breast lumpectomy", "General surgical history", "Breast surgery", "Breast", false],
  ["Bariatric surgery", "General surgical history", "General surgery", "Gastrointestinal", false],
  ["Sleeve gastrectomy", "General surgical history", "General surgery", "Gastrointestinal", false],
  ["Gastric bypass", "General surgical history", "General surgery", "Gastrointestinal", false],
  ["Abdominoplasty", "General surgical history", "Plastic surgery", "Abdominal wall", false],
  ["Liposuction", "General surgical history", "Plastic surgery", "Soft tissue", false],
  ["Laparotomy", "General surgical history", "General surgery", "Abdomen", false],
  ["Exploratory laparotomy", "General surgical history", "General surgery", "Abdomen", false],
  ["Orthopedic fracture fixation", "General surgical history", "Orthopedics", "Musculoskeletal", false],
  ["Spinal surgery", "General surgical history", "Orthopedics", "Spine", false],
  ["Cardiac catheterization", "General surgical history", "Cardiology", "Cardiovascular", false],
  ["Coronary artery bypass grafting", "General surgical history", "Cardiac surgery", "Cardiovascular", false],
  ["Cataract surgery", "General surgical history", "Ophthalmology", "Eye", false],
  ["Rhinoplasty", "General surgical history", "ENT/Plastic surgery", "Nose", false],
  ["Septoplasty", "General surgical history", "ENT", "Nose", false]
];

try {
  for (const [name, category, specialty, bodySystem, isObGyn] of operations) {
    await prisma.operationCatalogItem.upsert({
      where: { normalizedName: normalizeName(name) },
      update: { name, category, specialty, bodySystem, isObGyn, isSurgical: true, isActive: true, sourceType: "curated_reference", reviewStatus: "reviewed" },
      create: { code: codeFromName("OP", name), name, normalizedName: normalizeName(name), category, specialty, bodySystem, isObGyn, isSurgical: true, sourceType: "curated_reference", reviewStatus: "reviewed", isActive: true }
    });
  }
  const count = await prisma.operationCatalogItem.count();
  console.log(`V121-SEED-OPERATIONS PASS upserted=${operations.length} total=${count}`);
} finally {
  await prisma.$disconnect();
}
