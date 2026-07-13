import { Module } from "@nestjs/common";
import { forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { UsersModule } from "../users/users.module";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

@Module({
  imports: [PrismaModule, UsersModule, forwardRef(() => AuthModule)],
  controllers: [AuditController],
  providers: [AuditService, PermissionsGuard],
  exports: [AuditService]
})
export class AuditModule {}
