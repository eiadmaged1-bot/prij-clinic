import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const forbiddenUi = ["Prij Clinic"];
const forbiddenVisibleTerms = [
  "Demo Route",
  "demo route",
  "Demo Clinical",
  "Demo Workflow",
  "Demo complaint",
  "Demo workflow note only",
  "Archived fixture",
  "route check fixture",
  "Test Intake",
  "Review DoctorUX",
  "UX-",
  "Runtime",
  "QA",
  "QA Route",
  "Runtime Route",
  "Test Route",
  "fake CI",
  "Demo appointment",
  "QA appointment",
  "Runtime appointment",
  "Test appointment"
];
const uiFiles = [
  "apps/web/app/login/page.tsx",
  "apps/web/app/mvp-page.tsx",
  "apps/web/app/dashboard/page.tsx",
  "apps/web/app/page.tsx",
  "apps/web/app/admin/page.tsx",
  "apps/web/app/admin/settings/page.tsx",
  "apps/web/app/layout.tsx"
];

const failures = [];

for (const file of uiFiles) {
  const text = readFileSync(file, "utf8");
  for (const term of forbiddenUi) {
    if (text.includes(term)) failures.push(`${file} contains visible old branding: ${term}`);
  }
}

const [
  forbiddenServices,
  forbiddenUsers,
  forbiddenPatients,
  forbiddenIntakes,
  forbiddenAppointments,
  forbiddenGuidelineSources,
  cleanServices,
  totalCleanServices
] = await Promise.all([
  prisma.serviceItem.findMany({
    where: {
      OR: [
        { name: { in: ["Demo active finance service", "Demo admin service", "Demo finance consultation"], mode: "insensitive" } },
        { code: { startsWith: "DEMO-SVC-", mode: "insensitive" } },
        { code: { startsWith: "FIN-ACT-", mode: "insensitive" } },
        { code: { equals: "LAB-PANEL-DEMO", mode: "insensitive" } }
      ],
      active: true
    },
    select: { code: true, name: true }
  }),
  prisma.user.findMany({
    where: {
      OR: [
        { displayName: { in: ["Runtime Doctor", "Runtime Nurse", "Runtime Receptionist", "Runtime Accountant"], mode: "insensitive" } },
        { displayName: { startsWith: "Demo ", mode: "insensitive" } },
        { displayName: { startsWith: "Test ", mode: "insensitive" } }
      ],
      status: "active"
    },
    select: { email: true, displayName: true }
  }),
  prisma.patient.findMany({
    where: {
      status: "active",
      dataClassification: { notIn: ["TEST", "QUARANTINED"] },
      OR: [
        { medicalRecordNumber: { startsWith: "DEMO-", mode: "insensitive" } },
        { medicalRecordNumber: { startsWith: "TEST-", mode: "insensitive" } },
        { medicalRecordNumber: { startsWith: "LOCAL-PAT-", mode: "insensitive" } },
        { medicalRecordNumber: { startsWith: "QA-", mode: "insensitive" } },
        { medicalRecordNumber: { startsWith: "UX-", mode: "insensitive" } },
        { firstName: { startsWith: "Test Intake", mode: "insensitive" } },
        { firstName: { contains: "Runtime", mode: "insensitive" } },
        { firstName: { contains: "Review DoctorUX", mode: "insensitive" } },
        { lastName: { contains: "Archived fixture", mode: "insensitive" } },
        { notes: { contains: "Demo Workflow", mode: "insensitive" } },
        { notes: { contains: "Demo complaint", mode: "insensitive" } },
        { notes: { contains: "fake CI", mode: "insensitive" } }
      ]
    },
    select: { medicalRecordNumber: true, firstName: true, lastName: true }
  }),
  prisma.patientIntake.count({
    where: {
      OR: [
        { patientReportedJson: { path: ["title"], string_contains: "Test Intake" } },
        { administrativeJson: { path: ["title"], string_contains: "Test Intake" } }
      ]
    }
  }),
  prisma.appointment.findMany({
    where: {
      status: { not: "cancelled" },
      OR: forbiddenVisibleTerms.flatMap((term) => [
        { appointmentType: { contains: term, mode: "insensitive" } },
        { source: { contains: term, mode: "insensitive" } },
        { notes: { contains: term, mode: "insensitive" } }
      ])
    },
    select: { id: true, appointmentType: true, source: true, notes: true }
  }),
  prisma.guidelineSource.findMany({
    where: {
      active: true,
      OR: forbiddenVisibleTerms.flatMap((term) => [
        { name: { contains: term, mode: "insensitive" } },
        { organization: { contains: term, mode: "insensitive" } },
        { notes: { contains: term, mode: "insensitive" } }
      ])
    },
    select: { id: true, name: true, organization: true }
  }),
  prisma.serviceItem.findMany({
    where: {
      code: { startsWith: "SVC-" },
      active: true,
      sourceType: "curated_reference",
      reviewStatus: "price_review_required"
    },
    select: { code: true, name: true, price: true }
  }),
  prisma.serviceItem.count({ where: { code: { startsWith: "SVC-" } } })
]);

if (forbiddenServices.length) failures.push(`Forbidden active services: ${JSON.stringify(forbiddenServices)}`);
if (forbiddenUsers.length) failures.push(`Forbidden active users: ${JSON.stringify(forbiddenUsers)}`);
if (forbiddenPatients.length) failures.push(`Forbidden active patients: ${JSON.stringify(forbiddenPatients)}`);
if (forbiddenIntakes) failures.push(`Forbidden intake submissions: ${forbiddenIntakes}`);
if (forbiddenAppointments.length) failures.push(`Forbidden appointments: ${JSON.stringify(forbiddenAppointments)}`);
if (forbiddenGuidelineSources.length) failures.push(`Forbidden active guideline sources: ${JSON.stringify(forbiddenGuidelineSources)}`);
if (cleanServices.length !== 14 || totalCleanServices !== 14) failures.push(`Clean service catalog expected 14 stable SVC rows, got active=${cleanServices.length} total=${totalCleanServices}`);
if (cleanServices.some((service) => service.price !== null)) failures.push("Clean service catalog must be unpriced by default.");

await prisma.$disconnect();

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("NO-DEMO-DATA-GUARD PASS");
