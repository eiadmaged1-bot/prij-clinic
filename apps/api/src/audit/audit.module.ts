import { Module } from "@nestjs/common";
import { AppJwtService } from "../auth/jwt.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { UsersModule } from "../users/users.module";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [AuditController],
  providers: [AppJwtService, AuditService, JwtAuthGuard, PermissionsGuard],
  exports: [AuditService]
})
export class AuditModule {}
