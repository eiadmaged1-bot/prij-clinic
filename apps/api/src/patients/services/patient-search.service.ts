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

  async list(user: AuthUser, rawQuery?: string) {
    const query = rawQuery?.trim() ?? "";
    const normalizedPhone = query.replace(/\D/g, "");
    const where: Prisma.PatientWhereInput = { ...branchScope(user), NOT: demoPatientWhere() };
    if (query) {
      where.OR = [
        { medicalRecordNumber: { equals: query, mode: "insensitive" } },
        { firstName: { startsWith: query, mode: "insensitive" } },
        { lastName: { startsWith: query, mode: "insensitive" } },
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
        }
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
      const { clinicalPhases, ...row } = patient;
      return { ...row, currentPhase: clinicalPhases[0] ?? null };
    });
  }
}
