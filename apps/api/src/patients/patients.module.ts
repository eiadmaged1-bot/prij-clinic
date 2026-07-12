import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ClinicalTagsModule } from "../clinical-tags/clinical-tags.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { PatientsController } from "./patients.controller";
import { PatientsService } from "./patients.service";
import { PatientSearchService } from "./services/patient-search.service";

import { DoctorVisitModule } from "../doctor-visit/doctor-visit.module";

@Module({
  imports: [AuditModule, AuthModule, ClinicalTagsModule, PrismaModule, RbacModule, UsersModule, DoctorVisitModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientSearchService],
  exports: [PatientsService]
})
export class PatientsModule {}
