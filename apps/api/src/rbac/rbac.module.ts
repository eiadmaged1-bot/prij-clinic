import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { AppJwtService } from "../auth/jwt.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";
import { PermissionsGuard } from "./permissions.guard";
import { RbacService } from "./rbac.service";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, UsersModule],
  controllers: [AdminController],
  providers: [AppJwtService, JwtAuthGuard, PermissionsGuard, RbacService, RolesGuard],
  exports: [PermissionsGuard, RbacService, RolesGuard]
})
export class RbacModule {}
