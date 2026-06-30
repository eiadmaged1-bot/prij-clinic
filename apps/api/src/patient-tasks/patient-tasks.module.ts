import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { PatientTasksController } from "./patient-tasks.controller";
import { PatientTasksService } from "./patient-tasks.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [PatientTasksController],
  providers: [PatientTasksService]
})
export class PatientTasksModule {}
