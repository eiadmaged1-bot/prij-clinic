import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { DoctorVisitController } from "./doctor-visit.controller";
import { DoctorVisitService } from "./doctor-visit.service";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DoctorVisitController],
  providers: [DoctorVisitService]
})
export class DoctorVisitModule {}
