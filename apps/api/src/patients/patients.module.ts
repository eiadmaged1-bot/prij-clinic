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
import { PatientLookupService } from "./services/patient-lookup.service";
import { PatientWorkspaceLayoutService } from "./services/patient-workspace-layout.service";

import { DoctorVisitModule } from "../doctor-visit/doctor-visit.module";
import { ClinicTimeModule } from "../clinic-time/clinic-time.module";

@Module({
  imports: [AuditModule, AuthModule, ClinicalTagsModule, PrismaModule, RbacModule, UsersModule, DoctorVisitModule, ClinicTimeModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientSearchService, PatientLookupService, PatientWorkspaceLayoutService],
  exports: [PatientsService]
})
export class PatientsModule {}
