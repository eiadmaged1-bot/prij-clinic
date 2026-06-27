import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { UsersService } from "../users/users.service";
import { AppJwtService } from "./jwt.service";
import { PasswordService } from "./password.service";

type RequestMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly jwt: AppJwtService,
    private readonly audit: AuditService
  ) {}

  async login(email: string, password: string, metadata: RequestMetadata) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmailForAuth(normalizedEmail);
    const now = new Date();

    if (!user || user.status !== "active") {
      await this.audit.record({
        action: "auth.login_failure",
        resourceType: "session",
        severity: "medium",
        metadataJson: { reason: "invalid_credentials", email: normalizedEmail },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    const lockState = user as typeof user & {
      failedLoginCount?: number;
      lockedUntil?: Date | null;
    };

    if (lockState.lockedUntil && lockState.lockedUntil > now) {
      await this.audit.record({
        actorUserId: user.id,
        action: "auth.login_failure",
        resourceType: "session",
        branchId: user.branchId,
        severity: "high",
        metadataJson: { reason: "account_locked" },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    const passwordMatches = await this.passwords.verify(password, user.passwordHash);

    if (!passwordMatches) {
      const failedLoginCount = (lockState.failedLoginCount ?? 0) + 1;
      const lockedUntil =
        failedLoginCount >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount,
          lockedUntil
        } as unknown as never
      });
      await this.audit.record({
        actorUserId: user.id,
        action: "auth.login_failure",
        resourceType: "session",
        branchId: user.branchId,
        severity: lockedUntil ? "high" : "medium",
        metadataJson: { reason: "invalid_credentials", failedLoginCount },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
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
    const token = this.jwt.sign({ id: safeUser.id, email: safeUser.email });

    await this.audit.record({
      actorUserId: safeUser.id,
      action: "auth.login_success",
      resourceType: "session",
      branchId: safeUser.branchId,
      severity: "low",
      metadataJson: { email: safeUser.email },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    return { user: safeUser, token };
  }

  async logout(userId: string | undefined, branchId: string | null | undefined, metadata: RequestMetadata) {
    await this.audit.record({
      actorUserId: userId,
      action: "auth.logout",
      resourceType: "session",
      branchId,
      severity: "low",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
  }
}
