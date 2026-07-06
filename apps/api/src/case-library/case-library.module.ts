import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { CaseLibraryController } from "./case-library.controller";
import { CaseLibraryService } from "./case-library.service";

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RbacModule, UsersModule],
  controllers: [CaseLibraryController],
  providers: [CaseLibraryService]
})
export class CaseLibraryModule {}
