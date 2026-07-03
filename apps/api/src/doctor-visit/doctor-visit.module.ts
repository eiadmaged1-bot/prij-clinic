import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { DoctorVisitController } from "./doctor-visit.controller";
import { DoctorVisitService } from "./doctor-visit.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [DoctorVisitController],
  providers: [DoctorVisitService]
})
export class DoctorVisitModule {}
