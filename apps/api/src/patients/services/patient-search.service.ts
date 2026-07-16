import { ForbiddenException, Injectable } from "@nestjs/common";
import { PatientStatus, PatientType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { isOwnerOrAdmin } from "../../auth/scope";
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

  async list(user: AuthUser, options: { query?: string; mode?: string; includeArchived?: string; page?: string; limit?: string; branchId?: string; patientType?: string; status?: string; view?: string; sort?: string } = {}) {
    const query = options.query?.trim() ?? "";
    const directoryMode = options.mode === "directory";
    const directoryView = options.view ?? "active";
    if (directoryView === "qa_test" && !isOwnerOrAdmin(user)) throw new ForbiddenException("Only an Owner can review QA/test candidates.");
    const hygieneCandidateView = directoryView === "qa_test";
    const requestedStatus = hygieneCandidateView && isPatientStatus(options.status) ? options.status : PatientStatus.active;
    const requestedType = isPatientType(options.patientType) ? options.patientType : undefined;
    const requestedBranchId = directoryView === "current_branch" ? user.branchId ?? undefined : options.branchId && (isOwnerOrAdmin(user) || options.branchId === user.branchId) ? options.branchId : undefined;
    const page = Math.max(1, Math.min(1000, Number.parseInt(options.page ?? "1", 10) || 1));
    const limit = Math.max(5, Math.min(50, Number.parseInt(options.limit ?? "20", 10) || 20));
    if (!directoryMode && query.length < 2) return { patients: [], pageInfo: { page, limit, hasMore: false, total: 0 } };
    const normalizedPhone = query.replace(/\D/g, "");
    const queryTokens = query.split(/\s+/).map((token) => token.trim()).filter(Boolean).slice(0, 6);
    const qrToken = /^PRIJ-PATIENT:/i.test(query) ? query.replace(/^PRIJ-PATIENT:/i, "") : query;
    const uuidLookup = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(qrToken);
    const { start: queueDate, end: queueDateEnd } = this.clinicTime.getClinicDayBounds(this.clinicTime.getClinicDate());
    const where: Prisma.PatientWhereInput = {
      ...(requestedBranchId ? { branchId: requestedBranchId } : {}),
      status: requestedStatus,
      ...(requestedType ? { patientType: requestedType } : {}),
    };
    if (directoryView !== "qa_test") (where as Prisma.PatientWhereInput & { dataClassification?: unknown }).dataClassification = { notIn: ["TEST", "QUARANTINED"] };
    if (directoryView === "today") where.AND = [{ OR: [{ encounters: { some: { createdAt: { gte: queueDate, lt: queueDateEnd } } } }, { queueTickets: { some: { queueDate: { gte: queueDate, lt: queueDateEnd } } } }] }];
    if (directoryView === "waiting") where.queueTickets = { some: { queueDate: { gte: queueDate, lt: queueDateEnd }, status: { in: ["waiting", "called", "in_room"] } } };
    if (directoryView === "favorites") where.favorites = { some: { userId: user.id } };
    if (directoryView === "incomplete") where.AND = [{ OR: [{ phone: null }, { AND: [{ dateOfBirth: null }, { yearOfBirth: null }] }] }];
    if (directoryView === "qa_test") where.AND = [{ OR: demoPatientWhere() }];
    if (directoryView === "exact_phone_duplicates") {
      const duplicatePhones = (await this.prisma.patient.groupBy({
        by: ["phone"],
        where: { phone: { not: null } },
        _count: { phone: true },
        having: { phone: { _count: { gt: 1 } } }
      })).map((row) => row.phone).filter((phone): phone is string => Boolean(phone));
      where.AND = [{ phone: { in: duplicatePhones.length ? duplicatePhones : ["__NO_EXACT_PHONE_DUPLICATES__"] } }];
    }
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
    const effectiveSort = directoryView === "recent" ? "last_visit_desc" : options.sort;
    const orderBy = patientOrderBy(effectiveSort);
    const useRankedWindow = Boolean(query) || effectiveSort === "last_visit_desc";
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
        queueTickets: { where: { queueDate, status: { in: ["waiting", "called", "in_room"] } }, orderBy: { checkedInAt: "desc" }, take: 1, select: { id: true, status: true, queueDate: true, queueNumber: true, branchId: true, visitType: true } },
        favorites: { where: { userId: user.id }, select: { id: true }, take: 1 }
      }
    });
    const ranked = effectiveSort === "last_visit_desc"
      ? candidates.sort((left, right) => encounterTime(right.encounters[0]) - encounterTime(left.encounters[0]))
      : query
        ? candidates.sort((left, right) => patientSearchScore(right, query, normalizedPhone, qrToken) - patientSearchScore(left, query, normalizedPhone, qrToken) || right.updatedAt.getTime() - left.updatedAt.getTime())
        : candidates;
    const patients = useRankedWindow ? ranked.slice((page - 1) * limit, page * limit) : ranked;
    const branches = directoryMode ? await this.prisma.branch.findMany({
      where: { status: "active" },
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
        const { clinicalPhases, encounters, queueTickets, favorites, ...row } = patient;
        return { ...row, favorited: favorites.length > 0, phoneSuffix: patient.phone ? patient.phone.replace(/\D/g, "").slice(-4) : null, currentPhase: clinicalPhases[0] ?? null, latestVisitDate: encounters[0]?.startedAt ?? encounters[0]?.createdAt ?? null, queueState: queueTickets[0] ?? null };
      }),
      pageInfo: { page, limit, hasMore: page * limit < total, total },
      filters: { branches }
    };
  }

  async favorite(patientId: string, user: AuthUser) {
    const patient = await this.prisma.patient.findFirstOrThrow({ where: { id: patientId, status: "active", dataClassification: { notIn: ["TEST", "QUARANTINED"] } }, select: { id: true, branchId: true } });
    const favorite = await this.prisma.patientFavorite.upsert({ where: { patientId_userId: { patientId, userId: user.id } }, create: { patientId, userId: user.id }, update: {} });
    await this.audit.record({ actorUserId: user.id, action: "patient.favorite_added", resourceType: "patient", resourceId: patientId, branchId: patient.branchId, severity: "low" });
    return { patientId, favorited: true, favoriteId: favorite.id };
  }

  async unfavorite(patientId: string, user: AuthUser) {
    const removed = await this.prisma.patientFavorite.deleteMany({ where: { patientId, userId: user.id } });
    await this.audit.record({ actorUserId: user.id, action: "patient.favorite_removed", resourceType: "patient", resourceId: patientId, branchId: user.branchId, severity: "low", metadataJson: { removed: removed.count } });
    return { patientId, favorited: false };
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
