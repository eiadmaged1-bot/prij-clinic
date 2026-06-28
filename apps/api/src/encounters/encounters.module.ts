import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { EncountersController } from "./encounters.controller";
import { EncountersService } from "./encounters.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [EncountersController],
  providers: [EncountersService],
  exports: [EncountersService]
})
export class EncountersModule {}
