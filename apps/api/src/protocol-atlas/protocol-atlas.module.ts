import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { ProtocolAtlasController } from "./protocol-atlas.controller";
import { ProtocolAtlasService } from "./protocol-atlas.service";

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RbacModule, UsersModule],
  controllers: [ProtocolAtlasController],
  providers: [ProtocolAtlasService],
  exports: [ProtocolAtlasService]
})
export class ProtocolAtlasModule {}
