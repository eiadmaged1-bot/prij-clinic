import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminCalculatorsController, CalculatorsController } from "./calculators.controller";
import { CalculatorsService } from "./calculators.service";
import { FormulaEngineService } from "./formula-engine.service";
import { ObDatingService } from "./ob-dating.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CalculatorsController, AdminCalculatorsController],
  providers: [CalculatorsService, FormulaEngineService, ObDatingService]
})
export class CalculatorsModule {}
