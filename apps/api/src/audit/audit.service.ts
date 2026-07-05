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
    const metadataJson = sanitizeAuditMetadata(event.metadataJson);

    await this.prisma.auditLog.create({
      data: {
        actorUserId: event.actorUserId ?? null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId ?? null,
        branchId: event.branchId ?? null,
        severity: event.severity ?? "low",
        reason: sanitizeAuditString(event.reason) ?? null,
        metadataJson: metadataJson ?? undefined,
        ipAddress: event.ipAddress ?? null,
        userAgent: sanitizeAuditString(event.userAgent, 300) ?? null,
        requestId: sanitizeAuditString(event.requestId, 120) ?? null
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

const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERN = /(password|passcode|secret|token|authorization|cookie|api[_-]?key|jwt|session|credential|private[_-]?key)/i;

export function sanitizeAuditMetadata(value: unknown, depth = 0): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return sanitizeAuditObject(value as Record<string, unknown>, depth);
}

function sanitizeAuditObject(value: Record<string, unknown>, depth: number): Record<string, unknown> {
  if (depth >= 5) {
    return { truncated: true };
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return [key, REDACTED];
      }

      return [key, sanitizeAuditValue(entry, depth + 1)];
    })
  );
}

function sanitizeAuditValue(value: unknown, depth: number): unknown {
  if (typeof value === "string") {
    return sanitizeAuditString(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((entry) => sanitizeAuditValue(entry, depth + 1));
  }

  if (value && typeof value === "object") {
    return sanitizeAuditObject(value as Record<string, unknown>, depth);
  }

  return value;
}

function sanitizeAuditString(value: string | null | undefined, maxLength = 500) {
  if (!value) {
    return value;
  }

  const redacted = value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]")
    .replace(/(sk-[A-Za-z0-9_-]{8,}|sk-proj-[A-Za-z0-9_-]{8,})/g, REDACTED);

  return redacted.length > maxLength ? `${redacted.slice(0, maxLength)}...` : redacted;
}
