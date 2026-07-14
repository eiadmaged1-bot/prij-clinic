import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { PatientImportController } from "./patient-import.controller";
import { PatientImportService } from "./patient-import.service";

@Module({ imports: [AuditModule, AuthModule, PrismaModule, RbacModule], controllers: [PatientImportController], providers: [PatientImportService] })
export class PatientImportModule {}
