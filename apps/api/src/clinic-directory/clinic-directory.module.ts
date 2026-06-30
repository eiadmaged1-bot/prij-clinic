import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { ClinicDirectoryController } from "./clinic-directory.controller";
import { ClinicDirectoryService } from "./clinic-directory.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [ClinicDirectoryController],
  providers: [ClinicDirectoryService]
})
export class ClinicDirectoryModule {}
