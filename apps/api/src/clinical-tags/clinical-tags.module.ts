import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { ClinicalTagsController } from "./clinical-tags.controller";
import { ClinicalTagsService } from "./clinical-tags.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [ClinicalTagsController],
  providers: [ClinicalTagsService],
  exports: [ClinicalTagsService]
})
export class ClinicalTagsModule {}
