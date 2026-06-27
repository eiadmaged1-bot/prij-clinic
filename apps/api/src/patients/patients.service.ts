import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePatientDto, UpdatePatientDto } from "./dto";

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreatePatientDto, user: AuthUser) {
    const branchId = await this.resolveBranchId(user);

    try {
      const patient = await this.prisma.patient.create({
        data: {
          branchId,
          medicalRecordNumber: dto.medicalRecordNumber.trim(),
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          sex: dto.sex?.trim() || null,
          phone: dto.phone?.trim() || null,
          email: dto.email?.trim().toLowerCase() || null,
          notes: dto.notes?.trim() || null,
          createdByUserId: user.id
        }
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "patient.created",
        resourceType: "patient",
        resourceId: patient.id,
        branchId,
        severity: "medium",
        metadataJson: { changedFields: Object.keys(dto), medicalRecordNumber: patient.medicalRecordNumber }
      });

      return patient;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException("Medical record number already exists.");
      }

      throw error;
    }
  }

  list() {
    return this.prisma.patient.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 100
    });
  }

  async get(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });

    if (!patient) {
      throw new NotFoundException("Patient not found.");
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, user: AuthUser) {
    await this.get(id);
    const data: Prisma.PatientUpdateInput = {};
    const changedFields = Object.keys(dto);

    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.sex !== undefined) data.sex = dto.sex?.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) data.email = dto.email?.trim().toLowerCase() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;

    const patient = await this.prisma.patient.update({ where: { id }, data });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.updated",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { changedFields }
    });

    return patient;
  }

  private async resolveBranchId(user: AuthUser) {
    if (user.branchId) {
      return user.branchId;
    }

    const branch = await this.prisma.branch.findFirst({ orderBy: { createdAt: "asc" } });

    if (!branch) {
      throw new BadRequestException("Branch is not configured.");
    }

    return branch.id;
  }
}
