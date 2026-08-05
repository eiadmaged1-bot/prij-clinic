import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

export type SessionMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

type MemorySession = {
  id: string;
  userId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastSeenAt: Date;
  revocationReason: string | null;
};

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly memorySessions = new Map<string, MemorySession>();
  private fallbackWarningEmitted = false;

  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private hashIp(ip: string | null | undefined): string | null {
    if (!ip) return null;
    return crypto.createHash("sha256").update(ip).digest("hex");
  }

  private sessionDelegate(): any {
    const delegate = (this.prisma as unknown as { authSession?: any }).authSession;
    if (!delegate) {
      throw new Error("AuthSession Prisma delegate is unavailable.");
    }
    return delegate;
  }

  private isSessionSchemaCompatibilityError(error: unknown): boolean {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
    const message = error instanceof Error ? error.message : String(error);

    return (
      code === "P2021" ||
      code === "P2022" ||
      /AuthSession Prisma delegate is unavailable/i.test(message) ||
      /(?:table|relation).*AuthSession.*(?:does not exist|not found)/i.test(message) ||
      /AuthSession.*(?:does not exist|not found)/i.test(message)
    );
  }

  private canUseDevelopmentFallback(error: unknown): boolean {
    return process.env.NODE_ENV !== "production" && this.isSessionSchemaCompatibilityError(error);
  }

  private announceDevelopmentFallback(): void {
    if (this.fallbackWarningEmitted) return;
    this.fallbackWarningEmitted = true;
    this.logger.warn(
      "AuthSession database storage is not available. Using process-local development sessions. " +
        "Sessions will be cleared when the backend restarts. Apply migration " +
        "20260711192800_add_auth_session_foundation before production use."
    );
  }

  private throwSessionStorageError(error: unknown): never {
    if (this.isSessionSchemaCompatibilityError(error)) {
      this.logger.error(
        "AuthSession storage is unavailable and local compatibility mode is disabled.",
        error instanceof Error ? error.stack : undefined
      );
      throw new ServiceUnavailableException(
        "Session storage is not ready. Apply the AuthSession database migration before signing in."
      );
    }
    throw error;
  }

  private createMemorySession(
    userId: string,
    sessionTokenHash: string,
    expiresAt: Date
  ): MemorySession {
    const session: MemorySession = {
      id: crypto.randomUUID(),
      userId,
      sessionTokenHash,
      expiresAt,
      revokedAt: null,
      lastSeenAt: new Date(),
      revocationReason: null
    };
    this.memorySessions.set(sessionTokenHash, session);
    return session;
  }

  private validateMemorySession(
    sessionTokenHash: string
  ): { userId: string; sessionId: string } | null {
    const session = this.memorySessions.get(sessionTokenHash);
    if (!session) return null;

    const now = new Date();
    if (session.revokedAt || session.expiresAt < now) {
      return null;
    }

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    if (session.lastSeenAt < fiveMinutesAgo) {
      session.lastSeenAt = now;
    }

    return { userId: session.userId, sessionId: session.id };
  }

  /**
   * Creates a new AuthSession and returns the raw session token.
   * Development-only compatibility: when the AuthSession migration has not yet
   * been applied, use a process-local session without weakening credential checks.
   */
  async createSession(userId: string, metadata: SessionMetadata = {}): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const sessionTokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const userAgentSummary = metadata.userAgent ? metadata.userAgent.substring(0, 255) : null;
    const ipHash = this.hashIp(metadata.ipAddress);

    try {
      await this.sessionDelegate().create({
        data: {
          userId,
          sessionTokenHash,
          expiresAt,
          ipHash,
          userAgentSummary,
          createdRequestId: metadata.requestId || null,
          lastSeenAt: new Date()
        }
      });
    } catch (error) {
      if (!this.canUseDevelopmentFallback(error)) {
        this.throwSessionStorageError(error);
      }
      this.announceDevelopmentFallback();
      this.createMemorySession(userId, sessionTokenHash, expiresAt);
    }

    return rawToken;
  }

  /**
   * Validates a raw session token.
   * If valid, updates lastSeenAt (throttled to every 5 minutes to reduce DB load).
   */
  async validateSession(rawToken: string): Promise<{ userId: string; sessionId: string } | null> {
    const sessionTokenHash = this.hashToken(rawToken);

    try {
      const session = await this.sessionDelegate().findUnique({
        where: { sessionTokenHash },
        select: { id: true, userId: true, expiresAt: true, revokedAt: true, lastSeenAt: true }
      });

      if (!session) {
        return process.env.NODE_ENV !== "production"
          ? this.validateMemorySession(sessionTokenHash)
          : null;
      }

      const now = new Date();
      if (session.revokedAt || session.expiresAt < now) {
        return null;
      }

      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      if (!session.lastSeenAt || session.lastSeenAt < fiveMinutesAgo) {
        this.sessionDelegate()
          .update({
            where: { id: session.id },
            data: { lastSeenAt: now }
          })
          .catch(() => {
            // A last-seen update must not invalidate an otherwise valid session.
          });
      }

      return { userId: session.userId, sessionId: session.id };
    } catch (error) {
      if (!this.canUseDevelopmentFallback(error)) {
        this.throwSessionStorageError(error);
      }
      this.announceDevelopmentFallback();
      return this.validateMemorySession(sessionTokenHash);
    }
  }

  /**
   * Revokes a specific session by raw token.
   */
  async revokeSession(rawToken: string, reason?: string): Promise<void> {
    const sessionTokenHash = this.hashToken(rawToken);

    try {
      await this.sessionDelegate().updateMany({
        where: { sessionTokenHash, revokedAt: null },
        data: {
          revokedAt: new Date(),
          revocationReason: reason || "logout"
        }
      });
    } catch (error) {
      if (!this.canUseDevelopmentFallback(error)) {
        this.throwSessionStorageError(error);
      }
      this.announceDevelopmentFallback();
    }

    const memorySession = this.memorySessions.get(sessionTokenHash);
    if (memorySession && !memorySession.revokedAt) {
      memorySession.revokedAt = new Date();
      memorySession.revocationReason = reason || "logout";
    }
  }

  /**
   * Revokes all active sessions for a user.
   */
  async revokeAllUserSessions(userId: string, reason: string): Promise<void> {
    try {
      await this.sessionDelegate().updateMany({
        where: { userId, revokedAt: null },
        data: {
          revokedAt: new Date(),
          revocationReason: reason
        }
      });
    } catch (error) {
      if (!this.canUseDevelopmentFallback(error)) {
        this.throwSessionStorageError(error);
      }
      this.announceDevelopmentFallback();
    }

    for (const session of this.memorySessions.values()) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = new Date();
        session.revocationReason = reason;
      }
    }
  }

  /**
   * Cleans up expired and revoked sessions.
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    try {
      const result = await this.sessionDelegate().deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: thirtyDaysAgo } },
            { revokedAt: { lt: thirtyDaysAgo } }
          ]
        }
      });
      deletedCount += result.count;
    } catch (error) {
      if (!this.canUseDevelopmentFallback(error)) {
        this.throwSessionStorageError(error);
      }
      this.announceDevelopmentFallback();
    }

    for (const [tokenHash, session] of this.memorySessions.entries()) {
      const oldRevocation = session.revokedAt && session.revokedAt < thirtyDaysAgo;
      const oldExpiration = session.expiresAt < thirtyDaysAgo;
      if (oldRevocation || oldExpiration) {
        this.memorySessions.delete(tokenHash);
        deletedCount += 1;
      }
    }

    return deletedCount;
  }
}
