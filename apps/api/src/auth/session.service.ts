import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

export type SessionMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private hashIp(ip: string | null | undefined): string | null {
    if (!ip) return null;
    return crypto.createHash("sha256").update(ip).digest("hex");
  }

  /**
   * Creates a new AuthSession and returns the raw session token.
   */
  async createSession(userId: string, metadata: SessionMetadata = {}): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const sessionTokenHash = this.hashToken(rawToken);

    // Default expiration: 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const userAgentSummary = metadata.userAgent ? metadata.userAgent.substring(0, 255) : null;
    const ipHash = this.hashIp(metadata.ipAddress);

    await (this.prisma as any).authSession.create({
      data: {
        userId,
        sessionTokenHash,
        expiresAt,
        ipHash,
        userAgentSummary,
        createdRequestId: metadata.requestId || null,
        lastSeenAt: new Date()
      } as any // Use any because migration is not applied yet
    });

    return rawToken;
  }

  /**
   * Validates a raw session token.
   * If valid, updates lastSeenAt (throttled to every 5 minutes to reduce DB load).
   */
  async validateSession(rawToken: string): Promise<{ userId: string; sessionId: string } | null> {
    const sessionTokenHash = this.hashToken(rawToken);

    const session = await (this.prisma as any).authSession.findUnique({
      where: { sessionTokenHash },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true, lastSeenAt: true }
    });

    if (!session) {
      return null;
    }

    const now = new Date();

    // Check if expired or revoked
    if (session.revokedAt || session.expiresAt < now) {
      return null;
    }

    // Update lastSeenAt if more than 5 minutes ago
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    if (!session.lastSeenAt || session.lastSeenAt < fiveMinutesAgo) {
      // Fire and forget update
      (this.prisma as any).authSession.update({
        where: { id: session.id },
        data: { lastSeenAt: now }
      }).catch(() => { /* ignore update failures to not break auth flow */ });
    }

    return { userId: session.userId, sessionId: session.id };
  }

  /**
   * Revokes a specific session by raw token.
   */
  async revokeSession(rawToken: string, reason?: string): Promise<void> {
    const sessionTokenHash = this.hashToken(rawToken);

    await (this.prisma as any).authSession.updateMany({
      where: { sessionTokenHash, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revocationReason: reason || "logout"
      }
    });
  }

  /**
   * Revokes all active sessions for a user.
   */
  async revokeAllUserSessions(userId: string, reason: string): Promise<void> {
    await (this.prisma as any).authSession.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revocationReason: reason
      }
    });
  }

  /**
   * Cleans up expired and revoked sessions.
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    // Delete sessions that expired more than 30 days ago, or were revoked more than 30 days ago
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await (this.prisma as any).authSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: thirtyDaysAgo } },
          { revokedAt: { lt: thirtyDaysAgo } }
        ]
      }
    });

    return result.count;
  }
}
