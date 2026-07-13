import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { branchScope } from "../../auth/scope";
import type { AuthUser } from "../../auth/auth.types";

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
    private readonly audit: AuditService
  ) {}

  async list(user: AuthUser, options: { query?: string; mode?: string; includeArchived?: string } = {}) {
    const query = options.query?.trim() ?? "";
    const directoryMode = options.mode === "directory";
    const includeArchived = options.includeArchived === "true";
    if (!directoryMode && query.length < 2) return [];
    const normalizedPhone = query.replace(/\D/g, "");
    const where: Prisma.PatientWhereInput = {
      ...branchScope(user),
      ...(includeArchived ? {} : { status: { not: "archived" } }),
      NOT: demoPatientWhere()
    };
    if (query) {
      where.OR = [
        { medicalRecordNumber: { equals: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { notes: { contains: query, mode: "insensitive" } },
        ...(normalizedPhone ? [{ phone: { contains: normalizedPhone } } satisfies Prisma.PatientWhereInput] : [])
      ];
    }
    const patients = await this.prisma.patient.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: query ? 25 : 100,
      include: {
        clinicalPhases: {
          where: { status: "active" },
          orderBy: { startDate: "desc" },
          take: 1
        },
        encounters: { orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }], take: 1, select: { startedAt: true, createdAt: true } }
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.list_read",
      resourceType: "patient",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: patients.length }
    });

    return patients.map((patient) => {
      const { clinicalPhases, encounters, ...row } = patient;
      return { ...row, currentPhase: clinicalPhases[0] ?? null, latestVisitDate: encounters[0]?.startedAt ?? encounters[0]?.createdAt ?? null };
    });
  }
}
