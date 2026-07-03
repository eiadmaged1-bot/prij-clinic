import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { CareAssistController, MedicationSafetyProfilesController } from "./care-assist.controller";
import { CareAssistEvaluatorService } from "./care-assist-evaluator.service";
import { CareAssistRuleService } from "./care-assist-rule.service";
import { CareAssistService } from "./care-assist.service";
import { MedicationPregnancyLactationSafetyService } from "./medication-pregnancy-lactation-safety.service";

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RbacModule, UsersModule],
  controllers: [CareAssistController, MedicationSafetyProfilesController],
  providers: [CareAssistService, CareAssistRuleService, CareAssistEvaluatorService, MedicationPregnancyLactationSafetyService],
  exports: [CareAssistService, MedicationPregnancyLactationSafetyService]
})
export class CareAssistModule {}
