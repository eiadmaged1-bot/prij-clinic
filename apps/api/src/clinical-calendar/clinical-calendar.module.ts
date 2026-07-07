import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { ClinicalCalendarController } from "./clinical-calendar.controller";
import { ClinicalCalendarService } from "./clinical-calendar.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [ClinicalCalendarController],
  providers: [ClinicalCalendarService]
})
export class ClinicalCalendarModule {}
