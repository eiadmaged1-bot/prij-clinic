import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService, type AuditEventInput } from "../audit/audit.service";
import { UsersService } from "../users/users.service";
import { AppJwtService } from "./jwt.service";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";

type RequestMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly jwt: AppJwtService,
    private readonly audit: AuditService,
    private readonly sessionService: SessionService
  ) {}

  private async recordDeniedLoginSafely(event: AuditEventInput) {
    try {
      await this.audit.record(event);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${event.requestId ?? "unknown"}] Failed to record denied login audit event: ${message}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  private async trackFailedLoginSafely(
    userId: string,
    failedLoginCount: number,
    lockedUntil: Date | null,
    requestId?: string | null
  ) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginCount,
          lockedUntil
        } as unknown as never
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${requestId ?? "unknown"}] Failed to persist denied login state: ${message}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  async login(identifier: string, password: string, metadata: RequestMetadata) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await this.users.findByIdentifierForAuth(normalizedIdentifier);
    const now = new Date();

    if (!user || user.status !== "active") {
      await this.recordDeniedLoginSafely({
        action: "auth.login_failure",
        resourceType: "session",
        severity: "medium",
        metadataJson: { reason: "invalid_credentials", identifier: normalizedIdentifier },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        requestId: metadata.requestId
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    const lockState = user as typeof user & {
      failedLoginCount?: number;
      lockedUntil?: Date | null;
    };

    if (lockState.lockedUntil && lockState.lockedUntil > now) {
      await this.recordDeniedLoginSafely({
        actorUserId: user.id,
        action: "auth.login_failure",
        resourceType: "session",
        branchId: user.branchId,
        severity: "high",
        metadataJson: { reason: "account_locked" },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        requestId: metadata.requestId
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    const passwordMatches = await this.passwords.verify(password, user.passwordHash);

    if (!passwordMatches) {
      const failedLoginCount = (lockState.failedLoginCount ?? 0) + 1;
      const lockedUntil =
        failedLoginCount >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.trackFailedLoginSafely(
        user.id,
        failedLoginCount,
        lockedUntil,
        metadata.requestId
      );
      await this.recordDeniedLoginSafely({
        actorUserId: user.id,
        action: "auth.login_failure",
        resourceType: "session",
        branchId: user.branchId,
        severity: lockedUntil ? "high" : "medium",
        metadataJson: { reason: "invalid_credentials", failedLoginCount },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        requestId: metadata.requestId
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: now,
        failedLoginCount: 0,
        lockedUntil: null
      } as unknown as never
    });
    const updatedUser = await this.users.findByIdForAuth(user.id);
    const safeUser = this.users.toSafeUser(updatedUser);

    // Successful authentication remains strict: session creation and success auditing
    // must complete before access is granted.
    const sessionToken = await this.sessionService.createSession(user.id, metadata);

    await this.audit.record({
      actorUserId: safeUser.id,
      action: "auth.login_success",
      resourceType: "session",
      branchId: safeUser.branchId,
      severity: "low",
      metadataJson: { email: safeUser.email },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      requestId: metadata.requestId
    });

    return { user: safeUser, sessionToken };
  }

  async logout(userId: string | undefined, branchId: string | null | undefined, metadata: RequestMetadata, sessionToken?: string) {
    if (sessionToken) {
      await this.sessionService.revokeSession(sessionToken, "logout");
    }

    await this.audit.record({
      actorUserId: userId,
      action: "auth.logout",
      resourceType: "session",
      branchId,
      severity: "low",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      requestId: metadata.requestId
    });
  }
}
