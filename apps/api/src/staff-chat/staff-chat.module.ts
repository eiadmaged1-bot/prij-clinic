import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { StaffChatController } from "./staff-chat.controller";
import { StaffChatService } from "./staff-chat.service";

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RbacModule, UsersModule],
  controllers: [StaffChatController],
  providers: [StaffChatService]
})
export class StaffChatModule {}
