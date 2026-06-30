import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { MedicationsController } from "./medications.controller";
import { MedicationSafetyService } from "./medication-safety.service";
import { MedicationSearchService } from "./medication-search.service";
import { MedicationsService } from "./medications.service";

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RbacModule, UsersModule],
  controllers: [MedicationsController],
  providers: [MedicationsService, MedicationSearchService, MedicationSafetyService],
  exports: [MedicationsService, MedicationSearchService, MedicationSafetyService]
})
export class MedicationsModule {}
