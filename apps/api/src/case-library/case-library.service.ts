import { ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CaseLibraryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(query: Record<string, string | undefined>, user: AuthUser) {
    if (!hasClinicalLibraryRole(user)) throw new ForbiddenException("Clinical case library access is restricted.");
    const canViewAll = user.permissions.includes("clinical_case_library.view_all") || user.roles.includes("Owner") || user.roles.includes("Admin");
    const requestedScope = query.scope === "all" ? "all" : "mine";
    if (requestedScope === "all" && !canViewAll) throw new ForbiddenException("Trusted clinical access is required.");

    const page = clampInt(query.page, 1, 10_000, 1);
    const limit = clampInt(query.limit, 5, 50, 20);
    const scopeWhere: Prisma.EncounterWhereInput = requestedScope === "all" ? {} : {
      OR: [
        { doctorId: user.id },
        { startedByUserId: user.id },
        { signedByUserId: user.id },
        { staffMessages: { some: { senderUserId: user.id } } }
      ]
    };
    const where: Prisma.EncounterWhereInput = {
      ...branchScope(user),
      ...(query.branchId && canViewAll ? { branchId: query.branchId } : {}),
      dataClassification: { notIn: ["TEST", "QUARANTINED"] },
      patient: { dataClassification: { notIn: ["TEST", "QUARANTINED"] } } as Prisma.PatientRelationFilter,
      ...scopeWhere,
      ...(query.doctorId && canViewAll ? { doctorId: query.doctorId } : {}),
      ...(query.visitType ? { appointment: { appointmentType: { contains: query.visitType, mode: "insensitive" } } } : {}),
      ...(query.patientType ? { patient: { dataClassification: { notIn: ["TEST", "QUARANTINED"] }, patientType: query.patientType as never } } : {}),
      ...(query.status ? { status: query.status as never } : {}),
      ...(dateRange(query.dateRange, query.from, query.to)),
      ...(query.search ? searchWhere(query.search) : {})
    };

    const [total, patientGroups, draftCount, signedCount, encounters] = await this.prisma.$transaction([
      this.prisma.encounter.count({ where }),
      this.prisma.encounter.groupBy({ by: ["patientId"], where, orderBy: { patientId: "asc" } }),
      this.prisma.encounter.count({ where: { AND: [where, { status: "draft" }] } }),
      this.prisma.encounter.count({ where: { AND: [where, { status: "signed" }] } }),
      this.prisma.encounter.findMany({
        where,
        include: { patient: true, doctor: true, appointment: true },
        orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    const colleagueViews = encounters.filter((encounter) => encounter.doctorId !== user.id);
    const firstColleagueView = colleagueViews[0];
    if (firstColleagueView) {
      await this.audit.record({
        actorUserId: user.id,
        action: "CLINICAL_CASE_VIEWED",
        resourceType: "encounter",
        resourceId: firstColleagueView.id,
        branchId: user.branchId,
        severity: "high",
        metadataJson: {
          viewedByUserId: user.id,
          viewedCount: colleagueViews.length,
          sourceDoctorIds: [...new Set(colleagueViews.map((encounter) => encounter.doctorId))]
        }
      });
    }

    return {
      scope: requestedScope,
      scopeLabel: requestedScope === "mine" ? "Cases where you created, owned, started, signed, or clinically participated" : "All permitted clinic cases",
      canViewAll,
      summary: { caseCount: total, patientCount: patientGroups.length, draftCount, completedCount: signedCount, needsSignatureCount: draftCount },
      pageInfo: { page, limit, total, hasMore: page * limit < total },
      cases: encounters.map((encounter) => ({
        id: encounter.id,
        patientId: encounter.patientId,
        patientName: `${encounter.patient.firstName} ${encounter.patient.lastName}`.trim(),
        medicalRecordNumber: encounter.patient.medicalRecordNumber,
        patientPhone: encounter.patient.phone,
        patientType: encounter.patient.patientType,
        visitDateTime: (encounter.startedAt ?? encounter.createdAt).toISOString(),
        visitType: encounter.appointment?.appointmentType ?? "Clinic visit",
        status: encounter.status,
        summaryPreview: encounter.chiefComplaint ?? encounter.assessmentText ?? "Doctor visit note",
        tags: buildTags(encounter),
        doctorSignature: signature(encounter),
        links: {
          patient: `/patients/${encounter.patientId}`,
          visit: `/patients/${encounter.patientId}/visits/${encounter.id}/encounter`
        }
      }))
    };
  }

  async filters(user: AuthUser) {
    if (!hasClinicalLibraryRole(user)) throw new ForbiddenException("Clinical case library access is restricted.");
    const [doctors, branches] = await Promise.all([
      this.doctors(user),
      this.prisma.branch.findMany({ where: { ...branchScope(user), status: "active" }, select: { id: true, name: true }, orderBy: { name: "asc" } })
    ]);
    return { doctors, branches };
  }

  doctors(user: AuthUser) {
    if (!hasClinicalLibraryRole(user)) throw new ForbiddenException("Clinical case library access is restricted.");
    return this.prisma.user.findMany({
      where: {
        status: "active",
        userRoles: { some: { role: { name: { in: ["Owner", "Admin", "Doctor"] } } } },
        ...branchScope(user)
      },
      select: { id: true, displayName: true, doctorColor: true, doctorShortLabel: true },
      orderBy: { displayName: "asc" }
    });
  }
}

function clampInt(value: string | undefined, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function hasClinicalLibraryRole(user: AuthUser) {
  return user.roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));
}

function dateRange(dateRangeValue?: string, from?: string, to?: string): Prisma.EncounterWhereInput {
  const now = new Date();
  const start = new Date(now);
  if (dateRangeValue === "today") start.setHours(0, 0, 0, 0);
  else if (dateRangeValue === "week") start.setDate(now.getDate() - 7);
  else if (dateRangeValue === "month") start.setMonth(now.getMonth() - 1);
  else if (from || to) {
    return { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } };
  } else {
    return {};
  }
  return { createdAt: { gte: start } };
}

function searchWhere(search: string): Prisma.EncounterWhereInput {
  const value = search.trim();
  if (!value) return {};
  return {
    OR: [
      { patient: { firstName: { contains: value, mode: "insensitive" } } },
      { patient: { lastName: { contains: value, mode: "insensitive" } } },
      { patient: { medicalRecordNumber: { contains: value, mode: "insensitive" } } },
      { patient: { phone: { contains: value, mode: "insensitive" } } }
    ]
  };
}

function buildTags(encounter: { appointment: { appointmentType: string | null } | null; chiefComplaint: string | null; riskClassification: string | null }) {
  return [
    encounter.appointment?.appointmentType,
    encounter.riskClassification,
    /preg/i.test(encounter.chiefComplaint ?? "") ? "pregnancy" : null,
    /urgent|pain|bleeding/i.test(encounter.chiefComplaint ?? "") ? "urgent" : null
  ].filter(Boolean);
}

function signature(encounter: { doctorId: string; startedByUserId: string | null; doctorDisplayNameSnapshot: string | null; doctorColorSnapshot: string | null; startedAt: Date | null; createdAt: Date; doctor: { displayName: string; doctorColor: string | null; doctorShortLabel: string | null } }) {
  return {
    doctorId: encounter.doctorId,
    startedByUserId: encounter.startedByUserId,
    doctorName: encounter.doctorDisplayNameSnapshot ?? encounter.doctor.displayName,
    doctorShortLabel: encounter.doctor.doctorShortLabel,
    doctorColor: normalizeDoctorColor(encounter.doctorColorSnapshot ?? encounter.doctor.doctorColor, encounter.doctorId),
    startedAt: (encounter.startedAt ?? encounter.createdAt).toISOString()
  };
}

function normalizeDoctorColor(color: string | null | undefined, userId: string) {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) return color.toUpperCase();
  const palette = ["#0F766E", "#2563EB", "#7C3AED", "#C2410C", "#BE123C", "#047857", "#4338CA", "#A16207"];
  const code = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[code % palette.length];
}
