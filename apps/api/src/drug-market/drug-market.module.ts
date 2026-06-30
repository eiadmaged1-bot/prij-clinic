import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersModule } from "../users/users.module";
import { DrugMarketBadgeService } from "./drug-market-badge.service";
import { DrugMarketController } from "./drug-market.controller";
import { DrugMarketImportService } from "./drug-market-import.service";
import { DrugMarketSearchService } from "./drug-market-search.service";
import { DrugMarketService } from "./drug-market.service";

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, RbacModule, UsersModule],
  controllers: [DrugMarketController],
  providers: [DrugMarketService, DrugMarketSearchService, DrugMarketImportService, DrugMarketBadgeService],
  exports: [DrugMarketService, DrugMarketSearchService, DrugMarketBadgeService]
})
export class DrugMarketModule {}
