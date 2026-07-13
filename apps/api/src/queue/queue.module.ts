import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { IdempotencyModule } from "../idempotency/idempotency.module";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, RbacModule, UsersModule, IdempotencyModule],
  controllers: [QueueController],
  providers: [QueueService]
})
export class QueueModule {}
