import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { AdminCalculatorsController, CalculatorsController } from "./calculators.controller";
import { CalculatorsService } from "./calculators.service";
import { FormulaEngineService } from "./formula-engine.service";
import { MedicationFormulaEngineService } from "./medication-formula-engine.service";
import { ObDatingService } from "./ob-dating.service";

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RbacModule, UsersModule],
  controllers: [CalculatorsController, AdminCalculatorsController],
  providers: [CalculatorsService, FormulaEngineService, MedicationFormulaEngineService, ObDatingService]
})
export class CalculatorsModule {}
