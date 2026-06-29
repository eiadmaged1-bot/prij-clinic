import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { PrismaService } from "../prisma/prisma.service";

type SafetyInputMedication = {
  displayName?: string;
  genericName?: string;
  family?: string;
  herbalProductId?: string;
};

@Injectable()
export class MedicationSafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async run(dto: { patientId?: string; prescriptionId?: string; medications?: SafetyInputMedication[] }, user: AuthUser) {
    if (!dto.patientId && !dto.prescriptionId) {
      throw new BadRequestException("Patient or prescription context is required.");
    }

    const patient = dto.patientId ? await assertCanReferencePatient(this.prisma, dto.patientId, user) : null;
    const patientMedications = dto.patientId
      ? await this.prisma.patientMedication.findMany({ where: { patientId: dto.patientId, status: "active" } })
      : [];
    const allergies = dto.patientId
      ? await this.prisma.patientAllergy.findMany({ where: { patientId: dto.patientId, status: "active" } })
      : [];
    const candidateNames = [
      ...patientMedications.map((item) => item.genericName ?? item.displayName),
      ...(dto.medications ?? []).map((item) => item.genericName ?? item.displayName ?? "")
    ].map((item) => item.toLowerCase());

    const alerts: Array<{ severity: string; alertType: string; title: string; message: string }> = [];

    for (const allergy of allergies) {
      if (candidateNames.some((name) => name && allergy.displayName.toLowerCase().includes(name))) {
        alerts.push({
          severity: "critical",
          alertType: "allergy",
          title: "Allergy match requires doctor review",
          message: `${allergy.displayName} is recorded in the patient allergy list. This alert does not change the prescription.`
        });
      }
    }

    const duplicates = candidateNames.filter((name, index) => name && candidateNames.indexOf(name) !== index);
    if (duplicates.length) {
      alerts.push({
        severity: "moderate",
        alertType: "duplicate_therapy",
        title: "Possible duplicate therapy",
        message: "A repeated medication name was found. Doctor review is required before signing."
      });
    }

    if ((dto.medications ?? []).some((item) => item.herbalProductId || item.family?.toLowerCase().includes("herbal"))) {
      alerts.push({
        severity: "moderate",
        alertType: "herbal_caution",
        title: "Herbal or supplement review",
        message: "Herbal and supplement entries require clinician review with the medication list."
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        severity: "info",
        alertType: "review",
        title: "Safety review completed",
        message: "No seeded demo safety rule matched. This is not a final clinical decision."
      });
    }

    const check = await this.prisma.medicationSafetyCheck.create({
      data: {
        patientId: dto.patientId ?? null,
        prescriptionId: dto.prescriptionId ?? null,
        status: "draft",
        contextSummary: "Draft medication safety support only. Doctor approval is mandatory.",
        checkedByUserId: user.id,
        alerts: { create: alerts }
      },
      include: { alerts: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "medication_safety.checked",
      resourceType: "medication_safety_check",
      resourceId: check.id,
      branchId: patient?.branchId,
      severity: "high",
      metadataJson: { patientId: dto.patientId, prescriptionId: dto.prescriptionId, alertCount: check.alerts.length }
    });

    return check;
  }

  async list(patientId: string | undefined, user: AuthUser) {
    if (patientId) await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.medicationSafetyCheck.findMany({
      where: patientId ? { patientId } : {},
      include: { alerts: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  async get(id: string) {
    const check = await this.prisma.medicationSafetyCheck.findUnique({ where: { id }, include: { alerts: true } });
    if (!check) throw new NotFoundException("Safety check not found.");
    return check;
  }

  async reviewAlert(id: string, dto: { status?: string }, user: AuthUser) {
    const alert = await this.prisma.medicationSafetyAlert.update({
      where: { id },
      data: { status: dto.status ?? "reviewed", reviewedByUserId: user.id, reviewedAt: new Date() }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "medication_safety.alert_reviewed",
      resourceType: "medication_safety_alert",
      resourceId: alert.id,
      severity: "high",
      metadataJson: { status: alert.status, severity: alert.severity }
    });
    return alert;
  }

  async overrideAlert(id: string, dto: { reason?: string }, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("Override reason is required.");
    const alert = await this.prisma.medicationSafetyAlert.update({
      where: { id },
      data: {
        status: "overridden",
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
        overrideReason: dto.reason.trim()
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "medication_safety.alert_overridden",
      resourceType: "medication_safety_alert",
      resourceId: alert.id,
      severity: "critical",
      reason: dto.reason.trim(),
      metadataJson: { severity: alert.severity }
    });
    return alert;
  }
}
