import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClinicDepartmentDto, CreateExternalProviderDto, UpdateClinicDepartmentDto, UpdateExternalProviderDto } from "./dto";

@Injectable()
export class ClinicDirectoryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  listProviders() {
    return this.prisma.externalProvider.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], take: 100 });
  }

  async createProvider(dto: CreateExternalProviderDto, user: AuthUser) {
    const provider = await this.prisma.externalProvider.create({ data: providerData(dto) });
    await this.audit.record({ actorUserId: user.id, action: "external_provider.created", resourceType: "external_provider", resourceId: provider.id, severity: "medium", metadataJson: { providerType: provider.providerType } });
    return provider;
  }

  async updateProvider(id: string, dto: UpdateExternalProviderDto, user: AuthUser) {
    await this.ensureProvider(id);
    const provider = await this.prisma.externalProvider.update({ where: { id }, data: { ...providerData(dto), active: dto.active } });
    await this.audit.record({ actorUserId: user.id, action: "external_provider.updated", resourceType: "external_provider", resourceId: provider.id, severity: "medium", metadataJson: { changedFields: Object.keys(dto) } });
    return provider;
  }

  listDepartments() {
    return this.prisma.clinicDepartment.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], take: 100 });
  }

  async createDepartment(dto: CreateClinicDepartmentDto, user: AuthUser) {
    const department = await this.prisma.clinicDepartment.create({ data: { code: dto.code.trim(), name: dto.name.trim(), departmentType: dto.departmentType, branchId: user.branchId ?? null } });
    await this.audit.record({ actorUserId: user.id, action: "clinic_department.created", resourceType: "clinic_department", resourceId: department.id, branchId: department.branchId, severity: "medium", metadataJson: { departmentType: department.departmentType } });
    return department;
  }

  async updateDepartment(id: string, dto: UpdateClinicDepartmentDto, user: AuthUser) {
    await this.ensureDepartment(id);
    const department = await this.prisma.clinicDepartment.update({ where: { id }, data: { code: dto.code?.trim(), name: dto.name?.trim(), departmentType: dto.departmentType, active: dto.active } });
    await this.audit.record({ actorUserId: user.id, action: "clinic_department.updated", resourceType: "clinic_department", resourceId: department.id, branchId: department.branchId, severity: "medium", metadataJson: { changedFields: Object.keys(dto) } });
    return department;
  }

  private async ensureProvider(id: string) {
    const provider = await this.prisma.externalProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException("External provider not found.");
  }

  private async ensureDepartment(id: string) {
    const department = await this.prisma.clinicDepartment.findUnique({ where: { id } });
    if (!department) throw new NotFoundException("Clinic department not found.");
  }
}

function providerData(dto: CreateExternalProviderDto) {
  return {
    name: dto.name?.trim(),
    providerType: dto.providerType,
    contactName: dto.contactName?.trim() || null,
    phone: dto.phone?.trim() || null,
    email: dto.email?.trim().toLowerCase() || null,
    address: dto.address?.trim() || null,
    notes: dto.notes?.trim() || null
  };
}
