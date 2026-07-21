import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { ClinicalRequestsController, InvestigationsController } from "./investigations.controller";
import { InvestigationsService } from "./investigations.service";
import { StandaloneInvestigationsController } from "./standalone-investigations.controller";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [InvestigationsController, ClinicalRequestsController, StandaloneInvestigationsController],
  providers: [InvestigationsService]
})
export class InvestigationsModule {}
