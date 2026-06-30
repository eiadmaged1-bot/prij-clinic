import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CancelPatientTaskDto, CreatePatientTaskDto, UpdatePatientTaskDto } from "./dto";

const includeTask = { patient: true } satisfies Prisma.PatientTaskInclude;

@Injectable()
export class PatientTasksService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(user: AuthUser) {
    return this.prisma.patientTask.findMany({ where: this.visibilityWhere(user), orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], take: 100, include: includeTask });
  }

  async listForPatient(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.patientTask.findMany({ where: { patientId, ...branchScope(user) }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], include: includeTask });
  }

  async create(dto: CreatePatientTaskDto, user: AuthUser) {
    const patient = dto.patientId ? await assertCanReferencePatient(this.prisma, dto.patientId, user) : null;
    const task = await this.prisma.patientTask.create({
      data: {
        patientId: dto.patientId ?? null,
        branchId: patient?.branchId ?? user.branchId ?? null,
        assignedToUserId: dto.assignedToUserId ?? null,
        createdByUserId: user.id,
        relatedOrderId: dto.relatedOrderId ?? null,
        relatedResultId: dto.relatedResultId ?? null,
        relatedDocumentId: dto.relatedDocumentId ?? null,
        relatedConsentId: dto.relatedConsentId ?? null,
        taskType: dto.taskType,
        title: dto.title.trim(),
        description: clean(dto.description),
        priority: dto.priority ?? "normal",
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null
      },
      include: includeTask
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_task.created", resourceType: "patient_task", resourceId: task.id, branchId: task.branchId, severity: "medium", metadataJson: { patientId: task.patientId, taskType: task.taskType, priority: task.priority } });
    return task;
  }

  async update(id: string, dto: UpdatePatientTaskDto, user: AuthUser) {
    await this.get(id, user);
    const task = await this.prisma.patientTask.update({ where: { id }, data: { status: dto.status, title: dto.title?.trim(), description: dto.description === undefined ? undefined : clean(dto.description), assignedToUserId: dto.assignedToUserId }, include: includeTask });
    await this.audit.record({ actorUserId: user.id, action: "patient_task.updated", resourceType: "patient_task", resourceId: id, branchId: task.branchId, severity: "medium", metadataJson: { changedFields: Object.keys(dto), status: task.status } });
    return task;
  }

  async complete(id: string, user: AuthUser) {
    await this.get(id, user);
    const task = await this.prisma.patientTask.update({ where: { id }, data: { status: "done", completedAt: new Date() }, include: includeTask });
    await this.audit.record({ actorUserId: user.id, action: "patient_task.completed", resourceType: "patient_task", resourceId: id, branchId: task.branchId, severity: "medium", metadataJson: { patientId: task.patientId } });
    return task;
  }

  async cancel(id: string, dto: CancelPatientTaskDto, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("Cancellation reason is required.");
    await this.get(id, user);
    const task = await this.prisma.patientTask.update({ where: { id }, data: { status: "cancelled", cancellationReason: dto.reason.trim() }, include: includeTask });
    await this.audit.record({ actorUserId: user.id, action: "patient_task.cancelled", resourceType: "patient_task", resourceId: id, branchId: task.branchId, severity: "medium", reason: dto.reason.trim(), metadataJson: { patientId: task.patientId } });
    return task;
  }

  private async get(id: string, user: AuthUser) {
    const task = await this.prisma.patientTask.findFirst({ where: { id, ...this.visibilityWhere(user) }, include: includeTask });
    if (!task) throw new NotFoundException("Patient task not found.");
    return task;
  }

  private visibilityWhere(user: AuthUser): Prisma.PatientTaskWhereInput {
    const where: Prisma.PatientTaskWhereInput = branchScope(user);
    if (user.roles.includes("Accountant") && !user.roles.includes("Owner") && !user.roles.includes("Admin")) {
      where.taskType = { in: ["collect_payment", "admin_task"] };
    }
    return where;
  }
}

function clean(value?: string) {
  return value?.trim() || null;
}
