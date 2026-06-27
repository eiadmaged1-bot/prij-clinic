import { Module } from "@nestjs/common";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RbacModule } from "./rbac/rbac.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [PrismaModule, HealthModule, UsersModule, AuthModule, RbacModule, AuditModule]
})
export class AppModule {}
