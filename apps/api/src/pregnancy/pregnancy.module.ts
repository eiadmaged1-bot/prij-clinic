import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { PregnancyController } from "./pregnancy.controller";
import { PregnancyService } from "./pregnancy.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule],
  controllers: [PregnancyController],
  providers: [PregnancyService]
})
export class PregnancyModule {}
