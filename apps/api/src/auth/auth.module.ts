import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AppJwtService } from "./jwt.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PasswordService } from "./password.service";

@Module({
  imports: [AuditModule, PrismaModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AppJwtService, JwtAuthGuard, PasswordService],
  exports: [AppJwtService, JwtAuthGuard, PasswordService]
})
export class AuthModule {}
