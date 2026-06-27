import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type AuditEventInput = {
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  branchId?: string | null;
  severity?: string;
  reason?: string | null;
  metadataJson?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(event: AuditEventInput) {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: event.actorUserId ?? null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId ?? null,
        branchId: event.branchId ?? null,
        severity: event.severity ?? "low",
        reason: event.reason ?? null,
        metadataJson: event.metadataJson ?? undefined,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
        requestId: event.requestId ?? null
      } as unknown as never
    });
  }

  async listRecent(limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    return this.prisma.auditLog.findMany({
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actorUserId: true,
        action: true,
        resourceType: true,
        resourceId: true,
        branchId: true,
        severity: true,
        reason: true,
        metadataJson: true,
        ipAddress: true,
        userAgent: true,
        requestId: true,
        createdAt: true
      } as unknown as never
    });
  }
}
