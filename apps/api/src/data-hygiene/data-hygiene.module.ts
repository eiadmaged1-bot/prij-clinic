import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { DataHygieneController } from "./data-hygiene.controller";
import { DataHygieneService } from "./data-hygiene.service";

@Module({ imports: [PrismaModule, AuditModule, AuthModule, UsersModule], controllers: [DataHygieneController], providers: [DataHygieneService] })
export class DataHygieneModule {}
