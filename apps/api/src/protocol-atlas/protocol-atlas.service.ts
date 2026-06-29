import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { isOwnerOrAdmin } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { ProtocolReasonDto, UpdateProtocolAliasesDto, UpdateProtocolSourceDto, UpdateStructuredProtocolContentDto } from "./dto/editor-protocol.dto";
import { SearchProtocolsDto } from "./dto/search-protocols.dto";
import { UpdateProtocolStatusDto } from "./dto/update-protocol-status.dto";
import { normalizeProtocolContent, validateProtocolContentForStatus, validateVerifiedProtocolRequirements } from "./protocol-content.schema";

const allowedStatuses = new Set(["verified", "draft", "catalog_only", "retired"]);

@Injectable()
export class ProtocolAtlasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async list(user: AuthUser) {
    const protocols = await this.prisma.clinicalProtocol.findMany({
      where: { implementationStatus: { not: "retired" } },
      orderBy: [{ specialtyGroup: "asc" }, { title: "asc" }],
      take: 500,
      select: protocolSummarySelect
    });
    await this.audit.record({ actorUserId: user.id, action: "protocol_atlas.list_read", resourceType: "clinical_protocol", branchId: user.branchId, severity: "medium", metadataJson: { count: protocols.length } });
    return protocols;
  }

  async groups() {
    const groups = await this.prisma.clinicalProtocol.groupBy({
      by: ["specialtyGroup"],
      where: { implementationStatus: { not: "retired" } },
      _count: { _all: true },
      orderBy: { specialtyGroup: "asc" }
    });
    return groups.map((group) => ({ name: group.specialtyGroup, count: group._count._all }));
  }

  async search(dto: SearchProtocolsDto, user: AuthUser) {
    const query = dto.query?.trim();
    const group = dto.group?.trim();
    const status = dto.verifiedOnly ? "verified" : dto.status?.trim();
    const riskLevel = dto.riskLevel?.trim();
    const where: Prisma.ClinicalProtocolWhereInput = {
      implementationStatus: status ? status : { not: "retired" },
      ...(group ? { specialtyGroup: { contains: group, mode: "insensitive" } } : {}),
      ...(riskLevel ? { riskLevel } : {}),
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { title: { contains: query, mode: "insensitive" } },
              { condition: { contains: query, mode: "insensitive" } },
              { specialtyGroup: { contains: query, mode: "insensitive" } }
            ]
          }
        : {})
    };
    const protocols = await this.prisma.clinicalProtocol.findMany({ where, orderBy: [{ implementationStatus: "desc" }, { title: "asc" }], take: 500, select: protocolSummarySelect });
    const aliasMatched = query ? await this.aliasSearch(query, protocols.map((protocol) => protocol.id)) : [];
    const merged = [...protocols, ...aliasMatched].filter((protocol, index, all) => all.findIndex((item) => item.id === protocol.id) === index).slice(0, 500);
    await this.audit.record({ actorUserId: user.id, action: "protocol_atlas.search", resourceType: "clinical_protocol", branchId: user.branchId, severity: "medium", metadataJson: { count: merged.length, hasQuery: Boolean(query) } });
    return merged;
  }

  async get(id: string, user: AuthUser) {
    const protocol = await this.prisma.clinicalProtocol.findFirst({ where: { id, implementationStatus: { not: "retired" } } });
    if (!protocol) throw new NotFoundException("Protocol not found.");
    await this.audit.record({ actorUserId: user.id, action: "protocol_atlas.read", resourceType: "clinical_protocol", branchId: user.branchId, severity: "medium", metadataJson: { protocolId: protocol.id, code: protocol.code, status: protocol.implementationStatus } });
    return protocol;
  }

  async getByCode(code: string, user: AuthUser) {
    const protocol = await this.prisma.clinicalProtocol.findFirst({ where: { code, implementationStatus: { not: "retired" } } });
    if (!protocol) throw new NotFoundException("Protocol not found.");
    await this.audit.record({ actorUserId: user.id, action: "protocol_atlas.read", resourceType: "clinical_protocol", branchId: user.branchId, severity: "medium", metadataJson: { protocolId: protocol.id, code: protocol.code, status: protocol.implementationStatus } });
    return protocol;
  }

  async updateStatus(id: string, dto: UpdateProtocolStatusDto, user: AuthUser) {
    if (!isOwnerOrAdmin(user)) throw new ForbiddenException("Only owner/admin can change protocol verification status.");
    if (!allowedStatuses.has(dto.implementationStatus)) throw new BadRequestException("Unsupported implementation status.");
    assertReason(dto.reason);
    const existing = await this.prisma.clinicalProtocol.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Protocol not found.");
    const sourceName = dto.sourceName?.trim() || existing.sourceName;
    const content = validateProtocolContentForStatus(dto.implementationStatus, existing.contentJson);
    if (dto.implementationStatus === "verified") {
      validateVerifiedProtocolRequirements({
        ...existing,
        implementationStatus: "verified",
        sourceName,
        sourceYear: dto.sourceYear ?? existing.sourceYear,
        sourceVersion: dto.sourceVersion?.trim() || existing.sourceVersion,
        sourceUrl: dto.sourceUrl?.trim() || existing.sourceUrl,
        contentJson: content
      });
    }
    const protocol = await this.prisma.clinicalProtocol.update({
      where: { id },
      data: {
        implementationStatus: dto.implementationStatus,
        sourceName,
        sourceYear: dto.sourceYear ?? existing.sourceYear,
        sourceVersion: dto.sourceVersion?.trim() || existing.sourceVersion,
        sourceUrl: dto.sourceUrl?.trim() || existing.sourceUrl,
        contentJson: content as unknown as Prisma.InputJsonValue
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "protocol_status_changed", resourceType: "clinical_protocol", branchId: user.branchId, severity: "high", reason: dto.reason, metadataJson: { protocolId: id, fromStatus: existing.implementationStatus, toStatus: protocol.implementationStatus, code: protocol.code } });
    return protocol;
  }

  async getEditor(id: string, user: AuthUser) {
    if (!isOwnerOrAdmin(user)) throw new ForbiddenException("Only owner/admin can open the protocol editor.");
    const protocol = await this.prisma.clinicalProtocol.findUnique({ where: { id } });
    if (!protocol) throw new NotFoundException("Protocol not found.");
    await this.audit.record({ actorUserId: user.id, action: "protocol_editor_opened", resourceType: "clinical_protocol", branchId: user.branchId, severity: "medium", metadataJson: { protocolId: protocol.id, code: protocol.code, status: protocol.implementationStatus } });
    return { ...protocol, structuredContent: normalizeProtocolContent(protocol.contentJson) };
  }

  async updateSource(id: string, dto: UpdateProtocolSourceDto, user: AuthUser) {
    if (!isOwnerOrAdmin(user)) throw new ForbiddenException("Only owner/admin can update protocol sources.");
    assertReason(dto.reason);
    if (!dto.sourceName?.trim()) throw new BadRequestException("Source name is required.");
    const existing = await this.findExisting(id);
    const protocol = await this.prisma.clinicalProtocol.update({
      where: { id },
      data: {
        sourceName: dto.sourceName.trim(),
        sourceYear: dto.sourceYear ?? null,
        sourceVersion: dto.sourceVersion?.trim() || null,
        sourceUrl: dto.sourceUrl?.trim() || null
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "protocol_source_updated", resourceType: "clinical_protocol", branchId: user.branchId, severity: "high", reason: dto.reason, metadataJson: { protocolId: id, code: protocol.code, fromSourceName: existing.sourceName, toSourceName: protocol.sourceName } });
    return { ...protocol, structuredContent: normalizeProtocolContent(protocol.contentJson) };
  }

  async updateAliases(id: string, dto: UpdateProtocolAliasesDto, user: AuthUser) {
    if (!isOwnerOrAdmin(user)) throw new ForbiddenException("Only owner/admin can update protocol aliases.");
    assertReason(dto.reason);
    const existing = await this.findExisting(id);
    const aliases = Array.from(new Set(dto.aliases.map((alias) => alias.trim()).filter(Boolean))).slice(0, 20);
    if (!aliases.length) throw new BadRequestException("At least one alias is required.");
    const protocol = await this.prisma.clinicalProtocol.update({ where: { id }, data: { aliases } });
    await this.audit.record({ actorUserId: user.id, action: "protocol_aliases_updated", resourceType: "clinical_protocol", branchId: user.branchId, severity: "high", reason: dto.reason, metadataJson: { protocolId: id, code: protocol.code, previousAliasCount: Array.isArray(existing.aliases) ? existing.aliases.length : null, aliasCount: aliases.length } });
    return { ...protocol, structuredContent: normalizeProtocolContent(protocol.contentJson) };
  }

  async updateStructuredContent(id: string, dto: UpdateStructuredProtocolContentDto, user: AuthUser) {
    if (!isOwnerOrAdmin(user)) throw new ForbiddenException("Only owner/admin can update protocol content.");
    assertReason(dto.reason);
    const existing = await this.findExisting(id);
    const content = validateProtocolContentForStatus(existing.implementationStatus, dto.content);
    const protocol = await this.prisma.clinicalProtocol.update({ where: { id }, data: { contentJson: content as unknown as Prisma.InputJsonValue } });
    await this.audit.record({ actorUserId: user.id, action: "protocol_structured_content_updated", resourceType: "clinical_protocol", branchId: user.branchId, severity: "high", reason: dto.reason, metadataJson: { protocolId: id, code: protocol.code, status: protocol.implementationStatus, optionCount: content.options.length, rawJsonEdited: false } });
    return { ...protocol, structuredContent: content };
  }

  async requestVerification(id: string, dto: ProtocolReasonDto, user: AuthUser) {
    if (!isOwnerOrAdmin(user)) throw new ForbiddenException("Only owner/admin can request protocol verification.");
    assertReason(dto.reason);
    const existing = await this.findExisting(id);
    if (existing.implementationStatus !== "catalog_only") throw new BadRequestException("Only catalog-only protocols can move to draft verification.");
    const content = validateProtocolContentForStatus("draft", normalizeProtocolContent(existing.contentJson));
    const protocol = await this.prisma.clinicalProtocol.update({ where: { id }, data: { implementationStatus: "draft", contentJson: content as unknown as Prisma.InputJsonValue } });
    await this.audit.record({ actorUserId: user.id, action: "protocol_verification_requested", resourceType: "clinical_protocol", branchId: user.branchId, severity: "high", reason: dto.reason, metadataJson: { protocolId: id, code: protocol.code, fromStatus: existing.implementationStatus, toStatus: protocol.implementationStatus } });
    return { ...protocol, structuredContent: content };
  }

  async verify(id: string, dto: ProtocolReasonDto, user: AuthUser) {
    if (!isOwnerOrAdmin(user)) throw new ForbiddenException("Only owner/admin can verify protocols.");
    assertReason(dto.reason);
    const existing = await this.findExisting(id);
    if (existing.implementationStatus !== "draft") throw new BadRequestException("Only draft protocols can be verified.");
    const content = { ...validateProtocolContentForStatus("verified", existing.contentJson), verifiedManagementAvailable: true };
    validateVerifiedProtocolRequirements({ ...existing, implementationStatus: "verified", contentJson: content });
    const protocol = await this.prisma.clinicalProtocol.update({ where: { id }, data: { implementationStatus: "verified", contentJson: content as unknown as Prisma.InputJsonValue } });
    await this.audit.record({ actorUserId: user.id, action: "protocol_verified", resourceType: "clinical_protocol", branchId: user.branchId, severity: "high", reason: dto.reason, metadataJson: { protocolId: id, code: protocol.code, fromStatus: existing.implementationStatus, toStatus: protocol.implementationStatus, sourceName: protocol.sourceName } });
    return { ...protocol, structuredContent: content };
  }

  async retire(id: string, dto: ProtocolReasonDto, user: AuthUser) {
    if (!isOwnerOrAdmin(user)) throw new ForbiddenException("Only owner/admin can retire protocols.");
    assertReason(dto.reason);
    const existing = await this.findExisting(id);
    const content = { ...normalizeProtocolContent(existing.contentJson), verifiedManagementAvailable: false };
    const protocol = await this.prisma.clinicalProtocol.update({ where: { id }, data: { implementationStatus: "retired", contentJson: content as unknown as Prisma.InputJsonValue } });
    await this.audit.record({ actorUserId: user.id, action: "protocol_retired", resourceType: "clinical_protocol", branchId: user.branchId, severity: "high", reason: dto.reason, metadataJson: { protocolId: id, code: protocol.code, fromStatus: existing.implementationStatus, toStatus: protocol.implementationStatus } });
    return { ...protocol, structuredContent: content };
  }

  private async findExisting(id: string) {
    const existing = await this.prisma.clinicalProtocol.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Protocol not found.");
    return existing;
  }

  private async aliasSearch(query: string, excludeIds: string[]) {
    const normalized = query.toLowerCase();
    const candidates = await this.prisma.clinicalProtocol.findMany({
      where: { id: { notIn: excludeIds }, implementationStatus: { not: "retired" } },
      select: protocolSummarySelect,
      take: 500
    });
    return candidates.filter((protocol) => JSON.stringify(protocol.aliases).toLowerCase().includes(normalized)).slice(0, 15);
  }
}

const protocolSummarySelect = {
  id: true,
  code: true,
  title: true,
  specialtyGroup: true,
  condition: true,
  aliases: true,
  bodySystem: true,
  clinicalArea: true,
  implementationStatus: true,
  riskLevel: true,
  sourceName: true,
  sourceYear: true,
  sourceVersion: true
} satisfies Prisma.ClinicalProtocolSelect;

function assertReason(reason?: string | null) {
  if (!reason?.trim()) throw new BadRequestException("Audit reason is required.");
}
