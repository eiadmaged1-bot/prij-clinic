import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { IsString, MaxLength, MinLength } from "class-validator";
import { AuditService } from "../audit/audit.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";

class ArchiveInvestigationCatalogItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  confirmation!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(500)
  reason!: string;
}

@Controller("investigations/catalog-management")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvestigationCatalogArchiveController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  @Get()
  @Permissions("investigation.read")
  list(@CurrentUser() user: AuthUser) {
    this.assertDoctorOrOwner(user);
    return this.prisma.investigationCatalogItem.findMany({
      orderBy: [{ active: "desc" }, { category: "asc" }, { subcategory: "asc" }, { name: "asc" }],
      take: 500
    });
  }

  @Post(":id/archive")
  @Permissions("investigation.read")
  async archive(
    @Param("id") id: string,
    @Body() dto: ArchiveInvestigationCatalogItemDto,
    @CurrentUser() user: AuthUser
  ) {
    this.assertDoctorOrOwner(user);

    const item = await this.prisma.investigationCatalogItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Investigation catalog item not found.");
    if (!item.active) throw new BadRequestException("This investigation is already archived.");
    if (dto.confirmation.trim() !== item.name) {
      throw new BadRequestException("Type the exact investigation name to confirm archiving.");
    }

    const reason = dto.reason.trim();
    const [archivedItem, removedFavorites, removedListItems] = await this.prisma.$transaction([
      this.prisma.investigationCatalogItem.update({ where: { id }, data: { active: false } }),
      this.prisma.investigationFavorite.deleteMany({ where: { investigationCatalogItemId: id } }),
      this.prisma.investigationFavoriteSetItem.deleteMany({ where: { investigationCatalogItemId: id } })
    ]);

    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_catalog.archived",
      resourceType: "investigation_catalog_item",
      resourceId: id,
      branchId: user.branchId,
      severity: "high",
      reason,
      metadataJson: {
        code: item.code,
        name: item.name,
        category: item.category,
        previousActive: item.active,
        removedFavorites: removedFavorites.count,
        removedReusableListItems: removedListItems.count,
        historicalOrdersPreserved: true
      }
    });

    return {
      item: archivedItem,
      removedFavorites: removedFavorites.count,
      removedReusableListItems: removedListItems.count,
      historicalOrdersPreserved: true
    };
  }

  @Post(":id/restore")
  @Permissions("investigation.read")
  async restore(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    this.assertDoctorOrOwner(user);

    const item = await this.prisma.investigationCatalogItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Investigation catalog item not found.");
    if (item.active) return { item, restored: false };

    const restoredItem = await this.prisma.investigationCatalogItem.update({
      where: { id },
      data: { active: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_catalog.restored",
      resourceType: "investigation_catalog_item",
      resourceId: id,
      branchId: user.branchId,
      severity: "high",
      metadataJson: {
        code: item.code,
        name: item.name,
        category: item.category,
        previousActive: item.active
      }
    });

    return { item: restoredItem, restored: true };
  }

  private assertDoctorOrOwner(user: AuthUser) {
    if (!user.roles.some((role) => role === "Doctor" || role === "Owner")) {
      throw new ForbiddenException("Only a Doctor or Owner can archive or restore investigations.");
    }
  }
}
