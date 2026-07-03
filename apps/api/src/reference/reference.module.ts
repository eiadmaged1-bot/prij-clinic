import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { ReferenceController } from "./reference.controller";
import { ReferenceService } from "./reference.service";

@Module({
  imports: [AuthModule, PrismaModule, UsersModule],
  controllers: [ReferenceController],
  providers: [ReferenceService]
})
export class ReferenceModule {}
