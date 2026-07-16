import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../../audit/audit.service";
import type { AuthUser } from "../../auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";
import type { MissingInformationDecisionDto, SaveWorkspaceLayoutDto } from "../workspace-layout.dto";

const PANEL_KEYS = new Set(["overview", "allergies", "doctor-visit", "history", "medications", "prescriptions", "investigations", "pregnancy", "infertility", "ultrasound", "timeline", "tasks", "referrals", "documents", "consents", "billing", "internal-notes", "ai-snapshot", "more"]);
const MANDATORY_PANELS = new Set(["overview"]);
const PANEL_SIZES = new Set(["SMALL", "MEDIUM", "WIDE", "FULL"]);

const PRESETS: Record<string, string[]> = {
  MINIMAL_VISIT: ["overview", "allergies", "doctor-visit", "timeline"],
  GENERAL_WOMENS_HEALTH: ["overview", "allergies", "history", "doctor-visit", "investigations", "prescriptions", "timeline"],
  GYNECOLOGY: ["overview", "allergies", "history", "doctor-visit", "pregnancy", "ultrasound", "investigations", "prescriptions", "timeline"],
  AUB_FIBROID: ["overview", "allergies", "history", "doctor-visit", "ultrasound", "investigations", "medications", "tasks", "timeline"],
  PCOS_OVARIAN_MONITORING: ["overview", "allergies", "history", "infertility", "ultrasound", "investigations", "medications", "timeline"],
  INFERTILITY: ["overview", "allergies", "infertility", "ultrasound", "investigations", "prescriptions", "timeline"],
  ROUTINE_OBSTETRICS: ["overview", "allergies", "pregnancy", "ultrasound", "investigations", "prescriptions", "timeline"],
  HIGH_RISK_OBSTETRICS: ["overview", "allergies", "pregnancy", "ultrasound", "investigations", "tasks", "referrals", "prescriptions", "timeline"],
  POSTPARTUM: ["overview", "allergies", "pregnancy", "medications", "investigations", "tasks", "timeline"],
  CUSTOM: ["overview", "allergies", "doctor-visit", "timeline"]
};

@Injectable()
export class PatientWorkspaceLayoutService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async resolve(patientId: string, user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId }, select: { id: true, patientType: true } });
    if (!patient) throw new NotFoundException("Patient not found.");
    const scopeKeys = [
      `PATIENT:${user.id}:${patientId}`,
      `PERSONAL:${user.id}`,
      `SPECIALTY:${patient.patientType}`,
      ...user.roles.map((role) => `ROLE:${role}`),
      "CLINIC:DEFAULT"
    ];
    const model = (this.prisma as unknown as { patientWorkspaceLayout: any }).patientWorkspaceLayout;
    const layouts = await model.findMany({ where: { scopeKey: { in: scopeKeys }, OR: [{ published: true }, { userId: user.id }] }, include: { panels: { orderBy: { order: "asc" } } } });
    const resolved = scopeKeys.map((key) => layouts.find((layout: { scopeKey: string }) => layout.scopeKey === key)).find(Boolean);
    if (resolved) return { source: resolved.scope, precedenceKey: resolved.scopeKey, layout: resolved, presets: Object.keys(PRESETS) };
    return { source: "BUILT_IN", precedenceKey: "BUILT_IN:MINIMAL_VISIT", layout: builtInLayout("MINIMAL_VISIT"), presets: Object.keys(PRESETS) };
  }

  preset(key: string) {
    if (!PRESETS[key]) throw new NotFoundException("Workspace preset not found.");
    return builtInLayout(key);
  }

  async save(patientId: string, dto: SaveWorkspaceLayoutDto, user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId }, select: { id: true, branchId: true } });
    if (!patient) throw new NotFoundException("Patient not found.");
    const privileged = user.isSystemOwner || user.roles.some((role) => ["Owner", "Admin"].includes(role));
    if (["CLINIC", "ROLE", "SPECIALTY"].includes(dto.scope) && !privileged) throw new ForbiddenException("Only Owner or Admin can publish workspace templates.");
    if (dto.scope === "PATIENT" && !user.permissions.includes("patient.update") && !privileged) throw new ForbiddenException("Patient workspace override permission is required.");
    if (["CLINIC", "ROLE", "SPECIALTY", "PATIENT"].includes(dto.scope) && !dto.reason?.trim()) throw new BadRequestException("A reason is required for audited template or patient layout changes.");
    validatePanels(dto.panels);
    const scopeKey = workspaceScopeKey(dto, user.id, patientId);
    const model = (this.prisma as unknown as { patientWorkspaceLayout: any }).patientWorkspaceLayout;
    const existing = await model.findUnique({ where: { scopeKey }, select: { id: true, templateVersion: true } });
    const layout = await model.upsert({
      where: { scopeKey },
      update: { name: dto.name.trim(), roleKey: dto.roleKey?.trim() || null, specialtyKey: dto.specialtyKey?.trim() || null, presetKey: dto.presetKey ?? null, published: privileged ? Boolean(dto.published) : false, templateVersion: (existing?.templateVersion ?? 0) + 1, updatedByUserId: user.id, panels: { deleteMany: {}, create: dto.panels.map(panelData) } },
      create: { scope: dto.scope, scopeKey, name: dto.name.trim(), userId: ["PERSONAL", "PATIENT"].includes(dto.scope) ? user.id : null, patientId: dto.scope === "PATIENT" ? patientId : null, roleKey: dto.roleKey?.trim() || null, specialtyKey: dto.specialtyKey?.trim() || null, presetKey: dto.presetKey ?? null, published: privileged ? Boolean(dto.published) : false, createdByUserId: user.id, updatedByUserId: user.id, panels: { create: dto.panels.map(panelData) } },
      include: { panels: { orderBy: { order: "asc" } } }
    });
    await this.audit.record({ actorUserId: user.id, action: dto.scope === "PATIENT" ? "patient.workspace_layout_changed" : "workspace.template_changed", resourceType: "patient_workspace_layout", resourceId: layout.id, branchId: patient.branchId, reason: dto.reason ?? null, severity: dto.scope === "PATIENT" ? "high" : "medium", metadataJson: { scope: dto.scope, patientId: dto.scope === "PATIENT" ? patientId : undefined, templateVersion: layout.templateVersion, panelKeys: dto.panels.map((panel) => panel.panelKey) } });
    return layout;
  }

  async missingInformation(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId }, select: {
      id: true, dateOfBirth: true,
      patientAllergies: { take: 1, select: { id: true } },
      encounters: { where: { status: "draft" }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, signedAt: true } },
      pregnancies: { where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, estimatedDueDate: true, antenatalVisits: { orderBy: { visitDate: "desc" }, take: 1, select: { bloodPressure: true } } } },
      ovulationInductionCycles: { where: { outcome: "ongoing" }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, cycleDay: true } },
      investigationOrders: { where: { status: { in: ["requested", "sample_collected", "in_progress"] } }, orderBy: { requestedAt: "desc" }, take: 10, select: { id: true, requestedFollowUpDate: true, results: { take: 1, select: { id: true } } } },
      investigationResults: { where: { reviewStatus: "pending_review" }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true } },
      consentRecords: { where: { consentType: "treatment", status: "granted" }, take: 1, select: { id: true } }
    } });
    if (!patient) throw new NotFoundException("Patient not found.");
    const findings: Array<Record<string, unknown>> = [];
    const add = (key: string, missingItem: string, context: string, reason: string, severity: string, requirement: string, actionLink: string, state = "Not recorded") => findings.push({ key, missingItem, context, reason, severity, requirement, actionLink, state, ruleSource: "PRIJ_WORKSPACE_MISSING_INFORMATION", ruleVersion: "1.0.0" });
    if (!patient.dateOfBirth) add("DOB_ABSENT", "Date of birth", "patient", "Age-dependent context cannot be displayed without a recorded date of birth.", "medium", "recommended", `/patients/${patientId}?module=overview`);
    if (!patient.patientAllergies.length) add("ALLERGY_STATUS_UNKNOWN", "Allergy status", "patient", "No allergy status has been recorded.", "high", "required", `/patients/${patientId}?module=allergies`, "Needs doctor review");
    const encounter = patient.encounters[0];
    if (encounter && !encounter.signedAt) add("UNSIGNED_ENCOUNTER", "Encounter signature", "visit", "The active encounter remains unsigned.", "high", "required", `/patients/${patientId}?module=doctor-visit`, "Needs doctor review");
    const pregnancy = patient.pregnancies[0];
    if (pregnancy && !pregnancy.estimatedDueDate) add("PREGNANCY_EDD_ABSENT", "Confirmed EDD", "pregnancy", "The active pregnancy has no confirmed estimated due date.", "high", "required", `/patients/${patientId}?module=pregnancy`, "Needs doctor review");
    if (encounter && pregnancy && !pregnancy.antenatalVisits[0]?.bloodPressure) add("ACTIVE_VISIT_BP_ABSENT", "Blood pressure", "visit", "The active obstetric visit has no recorded blood pressure.", "high", "required", `/patients/${patientId}?module=pregnancy`);
    const cycle = patient.ovulationInductionCycles[0];
    if (cycle && cycle.cycleDay == null) add("INFERTILITY_CYCLE_DAY_ABSENT", "Cycle day", "infertility-cycle", "The active fertility cycle has no recorded cycle day.", "medium", "required", `/patients/${patientId}?module=infertility`);
    for (const order of patient.investigationOrders.filter((item) => !item.results.length)) add(`ORDER_RESULT_${order.id}`, "Investigation result", "investigation-order", "An ordered investigation has no result attached.", order.requestedFollowUpDate && order.requestedFollowUpDate < new Date() ? "high" : "medium", "required", `/patients/${patientId}?module=investigations`, order.requestedFollowUpDate && order.requestedFollowUpDate < new Date() ? "Overdue" : "Awaiting result");
    for (const result of patient.investigationResults) add(`RESULT_REVIEW_${result.id}`, "Result review", "investigation-result", "A received result is awaiting doctor review.", "high", "required", `/patients/${patientId}?module=investigations`, "Needs doctor review");
    if (encounter && !patient.consentRecords.length) add("TREATMENT_CONSENT_ABSENT", "Treatment consent", "visit", "No granted treatment consent is linked to the active visit context.", "high", "required", `/patients/${patientId}?module=consents`);
    const decisions = await this.prisma.auditLog.findMany({ where: { action: "patient.missing_information_decision", resourceType: "patient", resourceId: patientId }, orderBy: { createdAt: "desc" }, take: 100, select: { metadataJson: true } });
    const latest = new Map<string, { decision?: string; snoozedUntil?: string }>();
    for (const row of decisions) { const metadata = row.metadataJson && typeof row.metadataJson === "object" && !Array.isArray(row.metadataJson) ? row.metadataJson as Record<string, unknown> : {}; const key = typeof metadata.findingKey === "string" ? metadata.findingKey : ""; if (key && !latest.has(key)) latest.set(key, { decision: typeof metadata.decision === "string" ? metadata.decision : undefined, snoozedUntil: typeof metadata.snoozedUntil === "string" ? metadata.snoozedUntil : undefined }); }
    const visibleFindings = findings.filter((finding) => { const decision = latest.get(String(finding.key)); if (!decision) return true; if (["NOT_APPLICABLE", "PATIENT_DECLINED", "DISMISS"].includes(decision.decision ?? "")) return false; if (decision.decision === "SNOOZE" && decision.snoozedUntil && new Date(decision.snoozedUntil) > new Date()) return false; if (decision.decision === "AWAITING_EXTERNAL_RESULT") finding.state = "Awaiting external result"; return true; });
    return { findings: visibleFindings, ruleSource: "PRIJ_WORKSPACE_MISSING_INFORMATION", ruleVersion: "1.0.0", diagnosticOutput: false, prescribingOutput: false };
  }

  async decideMissingInformation(patientId: string, findingKey: string, dto: MissingInformationDecisionDto, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("A reason is required.");
    const current = await this.missingInformation(patientId);
    const finding = current.findings.find((item) => item.key === findingKey);
    if (!finding) throw new NotFoundException("Missing-information item is no longer active.");
    if (dto.decision === "DISMISS" && finding.severity === "high" && finding.requirement === "required") throw new BadRequestException("Mandatory safety information cannot be dismissed.");
    const snoozedUntil = dto.decision === "SNOOZE" ? new Date(dto.snoozedUntil ?? "") : null;
    if (dto.decision === "SNOOZE" && (!snoozedUntil || Number.isNaN(snoozedUntil.getTime()) || snoozedUntil <= new Date())) throw new BadRequestException("A future snooze date is required.");
    await this.audit.record({ actorUserId: user.id, action: "patient.missing_information_decision", resourceType: "patient", resourceId: patientId, branchId: user.branchId, severity: finding.severity === "high" ? "high" : "medium", reason: dto.reason.trim(), metadataJson: { findingKey, decision: dto.decision, snoozedUntil: snoozedUntil?.toISOString() ?? null } });
    return { patientId, findingKey, decision: dto.decision, snoozedUntil: snoozedUntil?.toISOString() ?? null, audited: true };
  }
}

function validatePanels(panels: SaveWorkspaceLayoutDto["panels"]) {
  if (!panels.length) throw new BadRequestException("At least one workspace panel is required.");
  if (new Set(panels.map((panel) => panel.panelKey)).size !== panels.length) throw new BadRequestException("Workspace panel keys must be unique.");
  for (const panel of panels) {
    if (!PANEL_KEYS.has(panel.panelKey)) throw new BadRequestException(`Unsupported workspace panel: ${panel.panelKey}`);
    if (!PANEL_SIZES.has(panel.size)) throw new BadRequestException("Unsupported workspace panel size.");
    if (MANDATORY_PANELS.has(panel.panelKey) && panel.hidden) throw new BadRequestException(`Mandatory panel ${panel.panelKey} cannot be hidden.`);
  }
  if (!panels.some((panel) => panel.panelKey === "overview")) throw new BadRequestException("The mandatory patient identity panel is required.");
}

function workspaceScopeKey(dto: SaveWorkspaceLayoutDto, userId: string, patientId: string) {
  if (dto.scope === "PATIENT") return `PATIENT:${userId}:${patientId}`;
  if (dto.scope === "PERSONAL") return `PERSONAL:${userId}`;
  if (dto.scope === "ROLE") { if (!dto.roleKey?.trim()) throw new BadRequestException("Role template requires a role key."); return `ROLE:${dto.roleKey.trim()}`; }
  if (dto.scope === "SPECIALTY") { if (!dto.specialtyKey?.trim()) throw new BadRequestException("Specialty template requires a specialty key."); return `SPECIALTY:${dto.specialtyKey.trim()}`; }
  return "CLINIC:DEFAULT";
}

function panelData(panel: SaveWorkspaceLayoutDto["panels"][number]) { return { panelKey: panel.panelKey, order: panel.order, column: panel.column, size: panel.size, collapsed: panel.collapsed, pinned: panel.pinned, hidden: panel.hidden }; }
function builtInLayout(key: string) { return { id: null, scope: "BUILT_IN", scopeKey: `BUILT_IN:${key}`, name: key.replaceAll("_", " "), presetKey: key, templateVersion: 1, published: true, panels: PRESETS[key]!.map((panelKey, order) => ({ panelKey, order, column: 1, size: panelKey === "overview" ? "FULL" : "MEDIUM", collapsed: false, pinned: panelKey === "overview", hidden: false })) }; }
