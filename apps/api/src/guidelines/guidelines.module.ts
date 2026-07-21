import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { GuidelineUserLibraryController } from "./guideline-user-library.controller";
import { GuidelineUserLibraryService } from "./guideline-user-library.service";
import { GuidelinesController } from "./guidelines.controller";
import { GuidelinesService } from "./guidelines.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [GuidelinesController, GuidelineUserLibraryController],
  providers: [GuidelinesService, GuidelineUserLibraryService]
})
export class GuidelinesModule {}
