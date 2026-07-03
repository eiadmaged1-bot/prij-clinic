import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { PrismaService } from "../prisma/prisma.service";
import { CareAssistEvaluatorService } from "./care-assist-evaluator.service";
import { DecisionCareAssistDto } from "./dto/decision-care-assist.dto";
import { EvaluateCareAssistDto } from "./dto/evaluate-care-assist.dto";

@Injectable()
export class CareAssistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly evaluator: CareAssistEvaluatorService
  ) {}

  async evaluate(dto: EvaluateCareAssistDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const evaluation = await this.evaluator.evaluate(dto);
    const rules = await this.prisma.careAssistRule.findMany({
      where: { isActive: true, code: { in: evaluation.findings.map((finding) => finding.ruleCode) } }
    });
    const ruleByCode = new Map(rules.map((rule) => [rule.code, rule]));
    const stored = [];

    for (const finding of evaluation.findings) {
      const rule = ruleByCode.get(finding.ruleCode);
      if (!rule) continue;
      const contextHash = this.evaluator.contextHash(dto, finding.ruleCode, finding.contextKey);
      stored.push(
        await this.prisma.careAssistFinding.upsert({
          where: {
            ruleId_patientId_contextHash: {
              ruleId: rule.id,
              patientId: dto.patientId,
              contextHash
            }
          },
          update: {
            title: finding.title,
            message: finding.message,
            category: rule.category,
            severity: rule.severity,
            dataUsedJson: evaluation.dataUsed as unknown as never,
            missingFieldsJson: finding.missingFields as unknown as never,
            suggestedActionJson: finding.suggestedAction as unknown as never,
            sourceJson: (finding.source ?? undefined) as unknown as never,
            status: "ACTIVE",
            encounterId: dto.encounterId ?? null,
            historySheetId: dto.historySheetId ?? null,
            prescriptionId: dto.prescriptionId ?? null,
            investigationOrderId: dto.investigationOrderId ?? null
          },
          create: {
            patientId: dto.patientId,
            encounterId: dto.encounterId ?? null,
            historySheetId: dto.historySheetId ?? null,
            prescriptionId: dto.prescriptionId ?? null,
            investigationOrderId: dto.investigationOrderId ?? null,
            ruleId: rule.id,
            title: finding.title,
            message: finding.message,
            category: rule.category,
            severity: rule.severity,
            dataUsedJson: evaluation.dataUsed as unknown as never,
            missingFieldsJson: finding.missingFields as unknown as never,
            suggestedActionJson: finding.suggestedAction as unknown as never,
            sourceJson: (finding.source ?? undefined) as unknown as never,
            contextHash
          }
        })
      );
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "care_assist.evaluated",
      resourceType: "care_assist_finding",
      branchId: patient.branchId,
      severity: "high",
      metadataJson: { patientId: dto.patientId, findingCount: stored.length, context: evaluation.dataUsed }
    });

    return { findings: stored, dataUsed: evaluation.dataUsed };
  }

  async listFindings(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.careAssistFinding.findMany({
      where: { patientId },
      include: { rule: true, decisions: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      take: 100
    });
  }

  async decide(id: string, dto: DecisionCareAssistDto, user: AuthUser) {
    const finding = await this.prisma.careAssistFinding.findUnique({
      where: { id },
      include: { patient: true }
    });
    if (!finding) throw new NotFoundException("Care Assist finding not found.");
    await assertCanReferencePatient(this.prisma, finding.patientId, user);

    if ((finding.severity === "HIGH" || finding.severity === "CRITICAL_REVIEW") && dto.decision === "DISMISS" && !dto.reason?.trim()) {
      throw new BadRequestException("Dismissal reason is required for high or critical review findings.");
    }
    if (dto.decision === "SNOOZE" && !dto.snoozedUntil) {
      throw new BadRequestException("Snoozed until date is required.");
    }

    const status = decisionToStatus(dto.decision);
    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.careAssistFinding.update({
        where: { id },
        data: {
          status,
          snoozedUntil: dto.decision === "SNOOZE" ? new Date(dto.snoozedUntil as string) : null,
          decisionReason: dto.reason?.trim() || null,
          decidedByUserId: user.id,
          decidedAt: new Date()
        }
      });
      await tx.careAssistDecision.create({
        data: {
          findingId: id,
          decision: dto.decision,
          reason: dto.reason?.trim() || null,
          decidedByUserId: user.id
        }
      });
      return saved;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "care_assist.finding_decision",
      resourceType: "care_assist_finding",
      resourceId: finding.id,
      branchId: finding.patient.branchId,
      severity: finding.severity === "CRITICAL_REVIEW" ? "critical" : "high",
      reason: dto.reason?.trim() || null,
      metadataJson: { decision: dto.decision, status, patientId: finding.patientId, category: finding.category, severity: finding.severity }
    });

    return updated;
  }
}

function decisionToStatus(decision: DecisionCareAssistDto["decision"]) {
  if (decision === "ACCEPT") return "ACCEPTED";
  if (decision === "DISMISS") return "DISMISSED";
  if (decision === "SNOOZE") return "SNOOZED";
  return "RESOLVED";
}
