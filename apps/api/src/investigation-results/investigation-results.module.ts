import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { InvestigationResultsController } from "./investigation-results.controller";
import { InvestigationResultsService } from "./investigation-results.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [InvestigationResultsController],
  providers: [InvestigationResultsService]
})
export class InvestigationResultsModule {}
