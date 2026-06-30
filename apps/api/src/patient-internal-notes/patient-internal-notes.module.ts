import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { PatientInternalNotesController } from "./patient-internal-notes.controller";
import { PatientInternalNotesService } from "./patient-internal-notes.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [PatientInternalNotesController],
  providers: [PatientInternalNotesService]
})
export class PatientInternalNotesModule {}
