import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ConsentsController } from "./consents.controller";
import { ConsentsService } from "./consents.service";

@Module({
  imports: [AuditModule, PrismaModule],
  controllers: [ConsentsController],
  providers: [ConsentsService]
})
export class ConsentsModule {}
