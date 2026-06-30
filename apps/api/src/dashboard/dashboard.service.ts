import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(user: AuthUser) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      appointmentsToday,
      waitingQueue,
      pendingReports,
      activePregnancies,
      draftUltrasounds,
      openInvoices,
      paymentTotals,
      pendingAiDrafts,
      pendingResultReview,
      criticalUnreviewedResults,
      openReferrals,
      openTasks,
      missingConsents,
      documentsAwaitingReview,
      orderedInvestigationsToday,
      followUpsDue
    ] = await Promise.all([
      this.prisma.appointment.count({ where: { startAt: { gte: today, lt: tomorrow }, ...branchScope(user) } }),
      this.prisma.queueTicket.count({ where: { status: "waiting", ...branchScope(user) } }),
      this.prisma.report.count({ where: { status: "review_pending", ...branchScope(user) } }),
      this.prisma.pregnancy.count({ where: { status: "active", ...branchScope(user) } }),
      this.prisma.obUltrasound.count({ where: { status: "draft", ...branchScope(user) } }),
      this.prisma.invoice.count({ where: { status: { in: ["draft", "issued", "partially_paid"] }, ...branchScope(user) } }),
      this.prisma.payment.aggregate({
        where: { status: "recorded", paidAt: { gte: today, lt: tomorrow }, ...branchScope(user) },
        _sum: { amount: true }
      }),
      this.prisma.aiDraft.count({ where: { status: "pending_doctor_review", ...branchScope(user) } })
      ,
      this.prisma.investigationResult.count({ where: { reviewStatus: "pending_review", ...branchScope(user) } }),
      this.prisma.investigationResult.count({ where: { criticalFlag: true, reviewStatus: { in: ["pending_review", "needs_follow_up"] }, ...branchScope(user) } }),
      this.prisma.referral.count({ where: { status: { in: ["draft", "sent", "accepted"] }, ...branchScope(user) } }),
      this.prisma.patientTask.count({ where: { status: { in: ["open", "in_progress"] }, ...branchScope(user) } }),
      this.prisma.consentRecord.count({ where: { status: { in: ["unknown", "declined"] }, patient: branchScope(user) } }),
      this.prisma.patientDocument.count({ where: { status: { in: ["draft_metadata", "active"] }, ...branchScope(user) } }),
      this.prisma.investigationOrder.count({ where: { requestedAt: { gte: today, lt: tomorrow }, ...patientBranchScopeForDashboard(user) } }),
      this.prisma.patientTask.count({ where: { taskType: "schedule_follow_up", dueAt: { lte: tomorrow }, status: { in: ["open", "in_progress"] }, ...branchScope(user) } })
    ]);

    return {
      operational: {
        appointmentsToday,
        waitingQueue,
        pendingReports,
        activePregnancies,
        draftUltrasounds
      },
      billing: {
        openInvoices,
        paymentsToday: paymentTotals._sum.amount?.toString() ?? "0.00"
      },
      safety: {
        aiEnabled: false,
        clinicalDraftsRequireDoctorReview: true,
        pendingAiDrafts
      },
      workflow: {
        pendingResultReview,
        criticalUnreviewedResults,
        openReferrals,
        openTasks,
        missingConsents,
        documentsAwaitingReview,
        orderedInvestigationsToday,
        followUpsDue
      }
    };
  }
}

function patientBranchScopeForDashboard(user: AuthUser) {
  if (user.roles.includes("Owner") || user.roles.includes("Admin")) return {};
  return { patient: { branchId: user.branchId ?? "00000000-0000-0000-0000-000000000000" } };
}
