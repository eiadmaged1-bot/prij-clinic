import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { ConsentsController } from "./consents.controller";
import { ConsentsService } from "./consents.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [ConsentsController],
  providers: [ConsentsService]
})
export class ConsentsModule {}
