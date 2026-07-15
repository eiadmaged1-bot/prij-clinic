import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { ClinicTimeService } from "../clinic-time/clinic-time.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicTime: ClinicTimeService
  ) {}

  async summary(user: AuthUser) {
    const dateString = this.clinicTime.getClinicDate();
    const { start: today, end: tomorrowMinus1Ms } = this.clinicTime.getClinicDayBounds(dateString);
    const tomorrow = new Date(tomorrowMinus1Ms.getTime() + 1);

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

  async ownerControl(user: AuthUser, requestedDate?: string) {
    if (!user.roles.includes("Owner")) throw new ForbiddenException("Owner access is required.");
    const clinicDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate ?? "") ? requestedDate! : this.clinicTime.getClinicDate();
    const { start, end } = this.clinicTime.getClinicDayBounds(clinicDate);
    const tomorrow = new Date(end.getTime() + 1);

    const [activeStaff, roles, activePatients, todayVisits, activeServices, externalReviews, importFailures, missingPrices, accountApprovals, guidelineReviews, lockedAccounts, revenueAggregate, paymentConfiguration, paymentRecords, servicePreview, recentAudit, activeOwners, activeBranches] = await Promise.all([
      safeMetric(() => this.prisma.user.count({ where: { status: "active" } })),
      safeMetric(() => this.prisma.role.count()),
      safeMetric(() => this.prisma.patient.count({ where: { status: "active" } })),
      safeMetric(() => this.prisma.encounter.count({ where: { startedAt: { gte: start, lt: tomorrow } } })),
      safeMetric(() => this.prisma.serviceItem.count({ where: { active: true } })),
      safeMetric(() => this.prisma.externalPatientSubmission.count({ where: { status: "pending_review" } })),
      safeMetric(() => this.prisma.patientImportRow.count({ where: { OR: [{ errorCode: { not: null } }, { status: { in: ["failed", "invalid", "validation_failed"] } }] } })),
      safeMetric(() => this.prisma.serviceItem.count({ where: { active: true, price: null } })),
      safeMetric(() => this.prisma.user.count({ where: { status: { in: ["pending", "pending_approval"] } } })),
      safeMetric(() => this.prisma.guidelineDocument.count({ where: { guidelineStatus: "NEEDS_REVIEW", archivedAt: null } })),
      safeMetric(() => this.prisma.user.count({ where: { lockedUntil: { gt: new Date() } } })),
      safeMetric(() => this.prisma.payment.aggregate({ where: { status: "recorded", paidAt: { gte: start, lt: tomorrow } }, _sum: { amount: true } })),
      safeMetric(() => this.prisma.systemSetting.findUnique({ where: { key: "billing.payments.configured" }, select: { valueJson: true } })),
      safeMetric(() => this.prisma.payment.count()),
      safeValue(() => this.prisma.serviceItem.findMany({ take: 5, orderBy: [{ active: "desc" }, { name: "asc" }], select: { id: true, name: true, category: true, price: true, costAmount: true, doctorShareAmount: true, currency: true, active: true } }), []),
      safeValue(() => this.prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, action: true, resourceType: true, severity: true, createdAt: true } }), []),
      safeMetric(() => this.prisma.user.count({ where: { status: "active", userRoles: { some: { role: { name: "Owner" } } } } })),
      safeMetric(() => this.prisma.branch.count({ where: { status: "active" } }))
    ]);

    const pendingTasks = [
      task("External intake reviews", externalReviews, "/external-intake"),
      task("Import row validation failures", importFailures, "/patients/import"),
      task("Services missing prices", missingPrices, "/admin/services"),
      task("Account approvals", accountApprovals, "/admin/accounts"),
      task("Guideline review", guidelineReviews, "/guidelines?view=review")
    ];
    const pendingReviews = sumAvailable([externalReviews, importFailures, missingPrices, accountApprovals, guidelineReviews]);
    const systemAlerts = sumAvailable([lockedAccounts, importFailures]);
    const paymentConfigured = paymentRecords.available && paymentRecords.value > 0 || paymentConfiguration.available && Boolean(paymentConfiguration.value);

    return {
      clinicDate,
      metrics: {
        activeStaff,
        roles,
        activePatients,
        todayVisits,
        activeServices,
        pendingReviews,
        revenueToday: paymentConfigured && revenueAggregate.available
          ? { available: true, configured: true, value: revenueAggregate.value._sum.amount?.toString() ?? "0.00", currency: "EGP" }
          : { available: revenueAggregate.available, configured: false, value: null, currency: "EGP" },
        systemAlerts
      },
      readiness: {
        checks: [
          { key: "active_owner", label: "Active Owner account", passed: activeOwners.available && activeOwners.value > 0 },
          { key: "active_branch", label: "Active clinic branch", passed: activeBranches.available && activeBranches.value > 0 },
          { key: "locked_accounts", label: "No currently locked staff accounts", passed: lockedAccounts.available && lockedAccounts.value === 0 },
          { key: "service_prices", label: "Active services have prices", passed: missingPrices.available && missingPrices.value === 0 }
        ],
        available: [activeOwners, activeBranches, lockedAccounts, missingPrices].every((entry) => entry.available)
      },
      pendingTasks: pendingTasks.filter((entry) => !entry.available || entry.count > 0),
      services: servicePreview.map((service) => ({ ...service, price: service.price?.toString() ?? null, costAmount: service.costAmount?.toString() ?? null, doctorShareAmount: service.doctorShareAmount?.toString() ?? null })),
      recentAudit,
      generatedAt: new Date().toISOString()
    };
  }
}

type Metric<T> = { available: true; value: T } | { available: false; value: null };

async function safeMetric<T>(query: () => Promise<T>): Promise<Metric<T>> {
  try { return { available: true, value: await query() }; } catch { return { available: false, value: null }; }
}

async function safeValue<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try { return await query(); } catch { return fallback; }
}

function sumAvailable(metrics: Array<Metric<number>>): Metric<number> {
  const available = metrics.filter((metric): metric is { available: true; value: number } => metric.available);
  return available.length ? { available: true, value: available.reduce((total, metric) => total + metric.value, 0) } : { available: false, value: null };
}

function task(label: string, metric: Metric<number>, href: string) {
  return { label, href, available: metric.available, count: metric.available ? metric.value : 0 };
}

function patientBranchScopeForDashboard(user: AuthUser) {
  if (user.roles.includes("Owner") || user.roles.includes("Admin")) return {};
  return { patient: { branchId: user.branchId ?? "00000000-0000-0000-0000-000000000000" } };
}
