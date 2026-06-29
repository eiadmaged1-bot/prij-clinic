import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { isOwnerOrAdmin } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { SearchProtocolsDto } from "./dto/search-protocols.dto";
import { UpdateProtocolStatusDto } from "./dto/update-protocol-status.dto";

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
    const where: Prisma.ClinicalProtocolWhereInput = {
      implementationStatus: { not: "retired" },
      ...(group ? { specialtyGroup: { contains: group, mode: "insensitive" } } : {}),
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
    const protocols = await this.prisma.clinicalProtocol.findMany({ where, orderBy: [{ implementationStatus: "desc" }, { title: "asc" }], take: 30, select: protocolSummarySelect });
    const aliasMatched = query ? await this.aliasSearch(query, protocols.map((protocol) => protocol.id)) : [];
    const merged = [...protocols, ...aliasMatched].filter((protocol, index, all) => all.findIndex((item) => item.id === protocol.id) === index).slice(0, 30);
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
    if ((dto.implementationStatus === "verified" || dto.implementationStatus === "retired") && !dto.reason?.trim()) throw new BadRequestException("Reason is required for verified or retired status changes.");
    const existing = await this.prisma.clinicalProtocol.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Protocol not found.");
    const sourceName = dto.sourceName?.trim() || existing.sourceName;
    if (dto.implementationStatus === "verified" && !sourceName?.trim()) throw new BadRequestException("Verified protocols require a source name.");
    const protocol = await this.prisma.clinicalProtocol.update({
      where: { id },
      data: {
        implementationStatus: dto.implementationStatus,
        sourceName,
        sourceYear: dto.sourceYear ?? existing.sourceYear,
        sourceVersion: dto.sourceVersion?.trim() || existing.sourceVersion,
        sourceUrl: dto.sourceUrl?.trim() || existing.sourceUrl
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "protocol_status_changed", resourceType: "clinical_protocol", branchId: user.branchId, severity: "high", reason: dto.reason, metadataJson: { protocolId: id, fromStatus: existing.implementationStatus, toStatus: protocol.implementationStatus, code: protocol.code } });
    return protocol;
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
