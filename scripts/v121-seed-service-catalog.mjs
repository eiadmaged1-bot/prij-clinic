import { codeFromName, createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const services = [
  ["Consultation", "Consultation"],
  ["Follow-up visit", "Consultation"],
  ["Antenatal care visit", "OB/GYN"],
  ["Gynecology consultation", "OB/GYN"],
  ["Infertility consultation", "OB/GYN"],
  ["Transvaginal ultrasound", "Ultrasound"],
  ["Obstetric ultrasound", "Ultrasound"],
  ["Folliculometry", "Ultrasound"],
  ["Pap smear collection", "Procedure"],
  ["IUD insertion", "Procedure"],
  ["IUD removal", "Procedure"],
  ["Implant insertion if applicable", "Procedure"],
  ["Implant removal if applicable", "Procedure"],
  ["Minor procedure", "Procedure"],
  ["Hysteroscopy", "Procedure"],
  ["Laparoscopy", "Procedure"]
];

try {
  for (const [name, category] of services) {
    const code = codeFromName("SVC", name);
    await prisma.serviceItem.upsert({
      where: { code },
      update: { name, category, active: true, sourceType: "curated_reference", reviewStatus: "price_review_required" },
      create: { code, name, category, price: null, currency: "EGP", active: true, sourceType: "curated_reference", reviewStatus: "price_review_required" }
    });
  }
  const count = await prisma.serviceItem.count();
  const unpriced = await prisma.serviceItem.count({ where: { price: null } });
  console.log(`V121-SEED-SERVICES PASS upserted=${services.length} total=${count} unpriced=${unpriced}`);
} finally {
  await prisma.$disconnect();
}
