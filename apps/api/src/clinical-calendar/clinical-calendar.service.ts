import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { gaDaysFromEdd, splitGa } from "../calculators/utils/date-gestational-age";

@Injectable()
export class ClinicalCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async edd(month: string | undefined, user: AuthUser) {
    if (!user.roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role))) {
      throw new ForbiddenException("EDD clinical calendar is restricted to Owner, Admin, and Doctor roles.");
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) throw new BadRequestException("month must use YYYY-MM.");
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const rows = await this.prisma.pregnancyDatingAssessment.findMany({
      where: {
        calculatedEdd: { gte: start, lt: end },
        voidedAt: null,
        isBestObstetricEstimate: true,
        OR: [{ isLocked: true }, { reviewedAt: { not: null } }],
        pregnancyEpisode: { status: "active", ...branchScope(user) }
      },
      include: {
        patient: { include: { clinicalPhases: { where: { status: "active" }, orderBy: { startDate: "desc" }, take: 1 }, clinicalTags: { take: 8, orderBy: { createdAt: "desc" } } } },
        pregnancyEpisode: true
      },
      orderBy: { calculatedEdd: "asc" },
      take: 200
    });
    await this.audit.record({ actorUserId: user.id, action: "clinical_calendar.edd_read", resourceType: "pregnancy_dating_assessment", branchId: user.branchId, severity: "medium", metadataJson: { month, count: rows.length } });
    return rows.map((row) => ({
      patientId: row.patientId,
      patientName: `${row.patient.firstName} ${row.patient.lastName}`.trim(),
      medicalRecordNumber: row.patient.medicalRecordNumber,
      eddDate: row.calculatedEdd.toISOString().slice(0, 10),
      gestationalAge: splitGa(gaDaysFromEdd(row.calculatedEdd, new Date())),
      patientType: row.patient.patientType,
      currentPhase: row.patient.clinicalPhases[0] ?? null,
      highRiskTags: row.patient.clinicalTags.filter((tag) => tag.category === "pregnancy_risk").map((tag) => tag.label),
      status: row.isLocked ? "locked" : "reviewed"
    }));
  }
}
