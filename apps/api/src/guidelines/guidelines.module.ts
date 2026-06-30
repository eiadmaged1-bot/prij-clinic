import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { GuidelinesController } from "./guidelines.controller";
import { GuidelinesService } from "./guidelines.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [GuidelinesController],
  providers: [GuidelinesService]
})
export class GuidelinesModule {}
