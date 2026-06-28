import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { AiDraftsController } from "./ai-drafts.controller";
import { AiDraftsService } from "./ai-drafts.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [AiDraftsController],
  providers: [AiDraftsService]
})
export class AiDraftsModule {}
