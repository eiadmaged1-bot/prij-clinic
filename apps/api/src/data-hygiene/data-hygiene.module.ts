import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { DataHygieneController } from "./data-hygiene.controller";
import { DataHygieneService } from "./data-hygiene.service";

@Module({ imports: [PrismaModule, AuditModule], controllers: [DataHygieneController], providers: [DataHygieneService] })
export class DataHygieneModule {}
