import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";
import { PermissionsGuard } from "./permissions.guard";
import { RbacService } from "./rbac.service";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [AuditModule, PrismaModule, UsersModule],
  controllers: [AdminController],
  providers: [PermissionsGuard, RbacService, RolesGuard],
  exports: [PermissionsGuard, RbacService, RolesGuard]
})
export class RbacModule {}
