import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/auth.types";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async live(q: string, user: AuthUser, scope?: string) {
    const query = q.trim();
    if (query.length < 2) return { sections: [] };

    const requested = new Set((scope ?? "").split(",").map((value) => value.trim()).filter(Boolean));
    const explicit = requested.size > 0 && !requested.has("global");
    const include = (name: string) => !explicit ? ["patients", "appointments"].includes(name) : requested.has(name);

    const settled = await Promise.allSettled([
      include("patients") && this.can(user, "patient.read") ? this.patients(query, user) : Promise.resolve(null),
      include("medications") && this.canAny(user, ["medications.search", "medications.read"]) ? this.medications(query, user) : Promise.resolve(null),
      include("investigations") && this.can(user, "investigation.read") ? this.investigations(query) : Promise.resolve(null),
      include("appointments") && (this.can(user, "appointment.read") || this.can(user, "appointments.read")) ? this.appointments(query, user) : Promise.resolve(null),
      include("invoices") && this.can(user, "billing.read") ? this.invoices(query, user) : Promise.resolve(null),
      include("clinical-requests") && this.can(user, "clinical_requests.read") ? this.clinicalRequests(query, user) : Promise.resolve(null),
      include("prescriptions") && this.can(user, "prescription.read") ? this.prescriptions(query, user) : Promise.resolve(null),
      include("templates") && this.can(user, "prescription_templates.read") ? this.prescriptionTemplates(query, user) : Promise.resolve(null),
      include("documents") && this.can(user, "patient_document.read") ? this.documents(query, user) : Promise.resolve(null),
      include("guidelines") && this.canAny(user, ["guideline.read", "guidelines.read", "guidelines.search"]) ? this.guidelines(query) : Promise.resolve(null)
    ]);
    const sections = settled.map((result) => result.status === "fulfilled" ? result.value : null);

    return {
      query,
      scope: scope ?? "global",
      sections: sections.filter((section): section is SearchSection => Boolean(section && section.results.length))
    };
  }

  private patients(q: string, user: AuthUser): Promise<SearchSection> {
    return this.prisma.patient
      .findMany({
        where: {
          ...branchPatientListScope(user),
          status: "active",
          dataClassification: { notIn: ["TEST", "QUARANTINED"] },
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { medicalRecordNumber: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } }
          ]
        },
        orderBy: { updatedAt: "desc" },
        take: 8
      })
      .then((patients) => ({
        title: "Patients",
        results: patients.map((patient) => ({
          id: patient.id,
          entityType: "patient",
          title: `${patient.firstName} ${patient.lastName}`.trim(),
          subtitle: patient.medicalRecordNumber,
          href: `/patients/${patient.id}`
        }))
      }));
  }

  private async medications(q: string, user: AuthUser): Promise<SearchSection> {
    const [generics, shortcuts] = await Promise.all([
      this.prisma.medicationGeneric.findMany({
        where: {
          isActive: true,
          OR: [
            { genericName: { contains: q, mode: "insensitive" } },
            { normalizedName: { contains: normalize(q), mode: "insensitive" } }
          ]
        },
        take: 6,
        orderBy: { genericName: "asc" }
      }),
      this.prisma.doctorMedicationShortcut.findMany({
        where: {
          doctorUserId: user.id,
          active: true,
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { genericName: { contains: q, mode: "insensitive" } },
            { optionalBrandOrTradeName: { contains: q, mode: "insensitive" } }
          ]
        },
        take: 4,
        orderBy: { updatedAt: "desc" }
      })
    ]);
    return {
      title: "Medications",
      results: [
        ...shortcuts.map((item) => ({ id: item.id, entityType: "doctor_medication_shortcut", title: item.displayName, subtitle: item.genericName })),
        ...generics.map((item) => ({ id: item.id, entityType: "medication", title: item.genericName, subtitle: "Generic reference" }))
      ]
    };
  }

  private investigations(q: string): Promise<SearchSection> {
    return this.prisma.investigationCatalogItem
      .findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { discipline: { contains: q, mode: "insensitive" } },
            { modality: { contains: q, mode: "insensitive" } }
          ]
        },
        take: 8,
        orderBy: { name: "asc" }
      })
      .then((items) => ({
        title: "Investigations",
        results: items.map((item) => ({ id: item.id, entityType: "investigation", title: item.name, subtitle: [item.category, item.modality].filter(Boolean).join(" | ") }))
      }));
  }

  private clinicalRequests(q: string, user: AuthUser): Promise<SearchSection> {
    return this.prisma.investigationOrder
      .findMany({
        where: {
          ...patientBranchScope(user),
          ...doctorScope(user),
          AND: [{ patient: operationalPatientRelation }],
          OR: [
            { notes: { contains: q, mode: "insensitive" } },
            { clinicalQuestion: { contains: q, mode: "insensitive" } },
            { diagnosisText: { contains: q, mode: "insensitive" } },
            { items: { some: { testName: { contains: q, mode: "insensitive" } } } },
            { items: { some: { itemName: { contains: q, mode: "insensitive" } } } }
          ]
        },
        include: { patient: true, items: true },
        take: 8,
        orderBy: { createdAt: "desc" }
      })
      .then((requests) => ({
        title: "Requests/Follow-up",
        results: requests.map((request) => ({
          id: request.id,
          entityType: "clinical_request",
          title: request.items.map((item) => item.testName).join(", ") || "Clinical request",
          subtitle: `${request.patient.firstName} ${request.patient.lastName} | ${request.status}`,
          href: `/patients/${request.patientId}`
        }))
      }));
  }

  private appointments(q: string, user: AuthUser): Promise<SearchSection> {
    return this.prisma.appointment
      .findMany({
        where: {
          ...patientBranchScope(user),
          AND: [{ patient: operationalPatientRelation }],
          OR: [
            { appointmentType: { contains: q, mode: "insensitive" } },
            appointmentStatusValue(q) ? { status: { equals: appointmentStatusValue(q) } } : undefined,
            { patient: { firstName: { contains: q, mode: "insensitive" } } },
            { patient: { lastName: { contains: q, mode: "insensitive" } } },
            { patient: { medicalRecordNumber: { contains: q, mode: "insensitive" } } }
          ].filter(Boolean) as Prisma.AppointmentWhereInput[]
        },
        include: { patient: true },
        take: 6,
        orderBy: { startAt: "desc" }
      })
      .then((appointments) => ({
        title: "Appointments",
        results: appointments.map((appointment) => ({
          id: appointment.id,
          entityType: "appointment",
          title: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
          subtitle: `${appointment.appointmentType ?? "Visit"} | ${appointment.status}`,
          href: `/patients/${appointment.patientId}`
        }))
      }));
  }

  private invoices(q: string, user: AuthUser): Promise<SearchSection> {
    return this.prisma.invoice
      .findMany({
        where: {
          ...patientBranchScope(user),
          AND: [{ patient: operationalPatientRelation }],
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { patient: { firstName: { contains: q, mode: "insensitive" } } },
            { patient: { lastName: { contains: q, mode: "insensitive" } } },
            { patient: { medicalRecordNumber: { contains: q, mode: "insensitive" } } }
          ]
        },
        include: { patient: true },
        take: 6,
        orderBy: { createdAt: "desc" }
      })
      .then((invoices) => ({
        title: "Invoices",
        results: invoices.map((invoice) => ({
          id: invoice.id,
          entityType: "invoice",
          title: invoice.invoiceNumber,
          subtitle: `${invoice.patient.firstName} ${invoice.patient.lastName} | ${invoice.status}`,
          href: `/patients/${invoice.patientId}`
        }))
      }));
  }

  private prescriptions(q: string, user: AuthUser): Promise<SearchSection> {
    return this.prisma.prescription
      .findMany({
        where: {
          ...patientBranchScope(user),
          AND: [{ patient: operationalPatientRelation }],
          OR: [
            { notes: { contains: q, mode: "insensitive" } },
            { patient: { firstName: { contains: q, mode: "insensitive" } } },
            { patient: { lastName: { contains: q, mode: "insensitive" } } },
            { items: { some: { medicationName: { contains: q, mode: "insensitive" } } } }
          ]
        },
        include: { patient: true, items: true },
        take: 6,
        orderBy: { createdAt: "desc" }
      })
      .then((prescriptions) => ({
        title: "Prescriptions",
        results: prescriptions.map((prescription) => ({
          id: prescription.id,
          entityType: "prescription",
          title: prescription.items.map((item) => item.medicationName).join(", ") || "Prescription",
          subtitle: `${prescription.patient ? `${prescription.patient.firstName} ${prescription.patient.lastName}`.trim() : "Patient"} | ${prescription.status}`,
          href: prescription.patientId ? `/patients/${prescription.patientId}` : undefined
        }))
      }));
  }

  private prescriptionTemplates(q: string, user: AuthUser): Promise<SearchSection> {
    return this.prisma.prescriptionTemplate
      .findMany({
        where: {
          active: true,
          AND: [
            { OR: [{ ownerUserId: null }, { ownerUserId: user.id }] },
            {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
                { diagnosisOrUseCase: { contains: q, mode: "insensitive" } }
              ]
            }
          ]
        },
        take: 8,
        orderBy: { updatedAt: "desc" }
      })
      .then((templates) => ({
        title: "Prescriptions",
        results: templates.map((template) => ({ id: template.id, entityType: "prescription_template", title: template.title, subtitle: template.category ?? "Saved template" }))
      }));
  }

  private documents(q: string, user: AuthUser): Promise<SearchSection> {
    return this.prisma.patientDocument
      .findMany({
        where: {
          ...patientBranchScope(user),
          AND: [{ patient: operationalPatientRelation }],
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { sourceText: { contains: q, mode: "insensitive" } },
            { summaryText: { contains: q, mode: "insensitive" } }
          ]
        },
        select: { id: true, patientId: true, title: true, category: true, status: true },
        take: 6,
        orderBy: { createdAt: "desc" }
      })
      .then((documents) => ({
        title: "Documents",
        results: documents.map((document) => ({
          id: document.id,
          entityType: "document",
          title: document.title,
          subtitle: `${document.category} | ${document.status}`,
          href: `/patients/${document.patientId}`
        }))
      }));
  }

  private guidelines(q: string): Promise<SearchSection> {
    return this.prisma.guidelineDocument
      .findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { topic: { contains: q, mode: "insensitive" } },
            { specialty: { contains: q, mode: "insensitive" } },
            { organization: { contains: q, mode: "insensitive" } },
            { chunks: { some: { text: { contains: q, mode: "insensitive" } } } }
          ]
        },
        take: 6,
        orderBy: { updatedAt: "desc" }
      })
      .then((documents) => ({
        title: "Guidelines",
        results: documents.map((document) => ({
          id: document.id,
          entityType: "guideline",
          title: document.title,
          subtitle: `${document.organization} | ${document.versionLabel ?? "version not set"}`,
          href: "/guidelines/search"
        }))
      }));
  }

  private can(user: AuthUser, permission: string) {
    return user.permissions.includes(permission);
  }

  private canAny(user: AuthUser, permissions: string[]) {
    return permissions.some((permission) => this.can(user, permission));
  }
}

type SearchSection = {
  title: string;
  results: Array<{ id: string; entityType: string; title: string; subtitle?: string | null; href?: string }>;
};

function appointmentStatusValue(value: string) {
  const normalized = value.toLowerCase();
  return ["booked", "rescheduled", "cancelled", "completed", "no_show"].includes(normalized) ? normalized as never : undefined;
}

function branchPatientListScope(user: AuthUser) {
  if (user.roles.includes("Owner") || user.roles.includes("Admin")) return {};
  return { branchId: user.branchId ?? "00000000-0000-0000-0000-000000000000" };
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
}

const operationalPatientRelation = { status: "active", dataClassification: { notIn: ["TEST", "QUARANTINED"] } } satisfies Prisma.PatientWhereInput;
