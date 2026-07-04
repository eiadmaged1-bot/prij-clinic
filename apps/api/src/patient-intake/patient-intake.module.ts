import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { PatientIntakeController } from "./patient-intake.controller";
import { PatientIntakeService } from "./patient-intake.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [PatientIntakeController],
  providers: [PatientIntakeService]
})
export class PatientIntakeModule {}
