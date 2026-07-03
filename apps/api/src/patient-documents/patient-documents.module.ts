import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { FilesModule } from "../files/files.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { PatientDocumentsController } from "./patient-documents.controller";
import { PatientDocumentsService } from "./patient-documents.service";

@Module({
  imports: [AuditModule, AuthModule, FilesModule, PrismaModule, RbacModule, UsersModule],
  controllers: [PatientDocumentsController],
  providers: [PatientDocumentsService]
})
export class PatientDocumentsModule {}
