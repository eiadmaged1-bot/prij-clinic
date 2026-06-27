import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import type { RequestWithUser } from "../auth/auth.types";
import { AuditService } from "./audit.service";

@Controller("audit")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Permissions("audit.read")
  async list(@Query("limit") limit: string | undefined, @Req() request: RequestWithUser) {
    await this.audit.record({
      actorUserId: request.user?.id,
      action: "audit.read",
      resourceType: "audit_log",
      branchId: request.user?.branchId,
      severity: "medium",
      metadataJson: { endpoint: "GET /audit" },
      ipAddress: request.ip,
      userAgent: request.get("user-agent") ?? null
    });

    return {
      auditLogs: await this.audit.listRecent(Number(limit) || 50)
    };
  }
}
