import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ProtocolAtlasModule } from "../protocol-atlas/protocol-atlas.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { AiManagementController } from "./ai-management.controller";
import { AiManagementService } from "./ai-management.service";

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RbacModule, UsersModule, ProtocolAtlasModule],
  controllers: [AiManagementController],
  providers: [AiManagementService]
})
export class AiManagementModule {}
