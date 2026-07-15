import { Injectable } from "@nestjs/common";
import { PatientStatus, PatientType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { branchScope, isOwnerOrAdmin } from "../../auth/scope";
import type { AuthUser } from "../../auth/auth.types";
import { ClinicTimeService } from "../../clinic-time/clinic-time.service";

export function demoPatientWhere(): Prisma.PatientWhereInput[] {
  return [
    { firstName: "Demo" },
    { firstName: "Jane", lastName: "Doe" },
    { firstName: "John", lastName: "Doe" }
  ];
}

@Injectable()
export class PatientSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly clinicTime: ClinicTimeService
  ) {}

  async list(user: AuthUser, options: { query?: string; mode?: string; includeArchived?: string; page?: string; limit?: string; branchId?: string; patientType?: string; status?: string; sort?: string } = {}) {
    const query = options.query?.trim() ?? "";
    const directoryMode = options.mode === "directory";
    const allStatuses = options.status === "all";
    const requestedStatus = isPatientStatus(options.status) ? options.status : directoryMode && !allStatuses ? PatientStatus.active : undefined;
    const includeArchived = options.includeArchived === "true" || requestedStatus === PatientStatus.archived || allStatuses;
    const requestedType = isPatientType(options.patientType) ? options.patientType : undefined;
    const requestedBranchId = options.branchId && (isOwnerOrAdmin(user) || options.branchId === user.branchId) ? options.branchId : undefined;
    const page = Math.max(1, Math.min(1000, Number.parseInt(options.page ?? "1", 10) || 1));
    const limit = Math.max(5, Math.min(50, Number.parseInt(options.limit ?? "20", 10) || 20));
    if (!directoryMode && query.length < 2) return { patients: [], pageInfo: { page, limit, hasMore: false, total: 0 } };
    const normalizedPhone = query.replace(/\D/g, "");
    const queryTokens = query.split(/\s+/).map((token) => token.trim()).filter(Boolean).slice(0, 6);
    const qrToken = /^PRIJ-PATIENT:/i.test(query) ? query.replace(/^PRIJ-PATIENT:/i, "") : query;
    const uuidLookup = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(qrToken);
    const { start: queueDate } = this.clinicTime.getClinicDayBounds(this.clinicTime.getClinicDate());
    const where: Prisma.PatientWhereInput = {
      ...branchScope(user),
      ...(requestedBranchId ? { branchId: requestedBranchId } : {}),
      ...(requestedStatus ? { status: requestedStatus } : includeArchived ? {} : { status: { not: PatientStatus.archived } }),
      ...(requestedType ? { patientType: requestedType } : {}),
      NOT: demoPatientWhere()
    };
    if (query) {
      where.OR = [
        { medicalRecordNumber: { equals: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        ...(uuidLookup ? [{ qrToken: qrToken } satisfies Prisma.PatientWhereInput] : []),
        ...(queryTokens.length > 1 ? [{ AND: queryTokens.map((token) => ({ OR: [{ firstName: { contains: token, mode: "insensitive" as const } }, { lastName: { contains: token, mode: "insensitive" as const } }] })) } satisfies Prisma.PatientWhereInput] : []),
        ...(normalizedPhone ? [{ phone: { contains: normalizedPhone } } satisfies Prisma.PatientWhereInput] : [])
      ];
    }
    const orderBy = patientOrderBy(options.sort);
    const useRankedWindow = Boolean(query) || options.sort === "last_visit_desc";
    const total = await this.prisma.patient.count({ where });
    const candidates = await this.prisma.patient.findMany({
      where,
      orderBy,
      ...(useRankedWindow ? { take: Math.min(total, 1000) } : { skip: (page - 1) * limit, take: limit }),
      include: {
        branch: { select: { id: true, name: true } },
        clinicalPhases: {
          where: { status: "active" },
          orderBy: { startDate: "desc" },
          take: 1
        },
        encounters: { orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }], take: 1, select: { startedAt: true, createdAt: true } },
        queueTickets: { where: { queueDate, status: { in: ["waiting", "called", "in_room"] } }, orderBy: { checkedInAt: "desc" }, take: 1, select: { id: true, status: true, queueDate: true, queueNumber: true, branchId: true, visitType: true } }
      }
    });
    const ranked = options.sort === "last_visit_desc"
      ? candidates.sort((left, right) => encounterTime(right.encounters[0]) - encounterTime(left.encounters[0]))
      : query
        ? candidates.sort((left, right) => patientSearchScore(right, query, normalizedPhone, qrToken) - patientSearchScore(left, query, normalizedPhone, qrToken) || right.updatedAt.getTime() - left.updatedAt.getTime())
        : candidates;
    const patients = useRankedWindow ? ranked.slice((page - 1) * limit, page * limit) : ranked;
    const branches = directoryMode ? await this.prisma.branch.findMany({
      where: isOwnerOrAdmin(user) ? { status: "active" } : { id: user.branchId ?? undefined, status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }) : [];

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.list_read",
      resourceType: "patient",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: patients.length }
    });

    return {
      patients: patients.map((patient) => {
        const { clinicalPhases, encounters, queueTickets, ...row } = patient;
        return { ...row, phoneSuffix: patient.phone ? patient.phone.replace(/\D/g, "").slice(-4) : null, currentPhase: clinicalPhases[0] ?? null, latestVisitDate: encounters[0]?.startedAt ?? encounters[0]?.createdAt ?? null, queueState: queueTickets[0] ?? null };
      }),
      pageInfo: { page, limit, hasMore: page * limit < total, total },
      filters: { branches }
    };
  }
}

function isPatientStatus(value?: string): value is PatientStatus {
  return Boolean(value && Object.values(PatientStatus).includes(value as PatientStatus));
}

function isPatientType(value?: string): value is PatientType {
  return Boolean(value && Object.values(PatientType).includes(value as PatientType));
}

function patientOrderBy(sort?: string): Prisma.PatientOrderByWithRelationInput[] {
  if (sort === "created_oldest") return [{ createdAt: "asc" }];
  if (sort === "name_az") return [{ firstName: "asc" }, { lastName: "asc" }];
  if (sort === "name_za") return [{ firstName: "desc" }, { lastName: "desc" }];
  if (sort === "file_number") return [{ medicalRecordNumber: "asc" }];
  return [{ createdAt: "desc" }, { updatedAt: "desc" }];
}

function encounterTime(encounter?: { startedAt: Date | null; createdAt: Date } | null) {
  return (encounter?.startedAt ?? encounter?.createdAt)?.getTime() ?? 0;
}

function patientSearchScore(patient: { medicalRecordNumber: string; firstName: string; lastName: string; phone: string | null; qrToken: string }, query: string, normalizedPhone: string, qrToken: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const fullName = `${patient.firstName} ${patient.lastName}`.trim().toLocaleLowerCase();
  if (patient.medicalRecordNumber.toLocaleLowerCase() === normalizedQuery) return 1000;
  if (patient.qrToken === qrToken) return 990;
  if (normalizedPhone && patient.phone?.replace(/\D/g, "") === normalizedPhone) return 980;
  if (fullName === normalizedQuery) return 950;
  if (patient.firstName.toLocaleLowerCase() === normalizedQuery || patient.lastName.toLocaleLowerCase() === normalizedQuery) return 900;
  if (fullName.startsWith(normalizedQuery)) return 800;
  return 100;
}
