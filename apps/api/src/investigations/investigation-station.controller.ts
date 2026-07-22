import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { AuditService } from "../audit/audit.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";

class CreateStationListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameAr?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  investigationCatalogItemIds!: string[];
}

@Controller("investigations/station")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvestigationStationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  @Get("workspace")
  @Permissions("investigation.read")
  async workspace(@CurrentUser() user: AuthUser) {
    const [items, favorites, sets] = await Promise.all([
      this.prisma.investigationCatalogItem.findMany({
        where: { active: true },
        orderBy: [{ category: "asc" }, { subcategory: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        take: 500
      }),
      this.prisma.investigationFavorite.findMany({
        where: { userId: user.id, investigationCatalogItem: { active: true } },
        include: { investigationCatalogItem: true },
        orderBy: { createdAt: "desc" },
        take: 200
      }),
      this.prisma.investigationFavoriteSet.findMany({
        where: {
          active: true,
          OR: [
            { userId: user.id },
            ...(user.branchId ? [{ scope: "branch", branchId: user.branchId }] : []),
            { scope: "clinic" }
          ]
        },
        include: {
          items: {
            where: { investigationCatalogItem: { active: true } },
            orderBy: { position: "asc" },
            include: { investigationCatalogItem: true }
          }
        },
        orderBy: [{ scope: "asc" }, { updatedAt: "desc" }],
        take: 200
      })
    ]);

    const favoriteIds = new Set(favorites.map((entry) => entry.investigationCatalogItemId));
    return {
      investigationCatalog: items.map((item) => ({ ...item, favorite: favoriteIds.has(item.id) })),
      favorites: favorites.map((entry) => ({ ...entry.investigationCatalogItem, favorite: true })),
      favoriteSets: sets.map((set) => ({
        ...set,
        editable: set.userId === user.id,
        items: set.items.map((entry) => ({ 
          investigationCatalogItem: entry.investigationCatalogItem,
          required: entry.required,
          rationale: entry.rationale,
          responsibilityJson: entry.responsibilityJson
        }))
      }))
    };
  }

  @Post("lists")
  @Permissions("investigation.read")
  async createList(@Body() dto: CreateStationListDto, @CurrentUser() user: AuthUser) {
    const name = dto.name.trim();
    const normalizedName = normalizeName(name);
    const existing = await this.prisma.investigationFavoriteSet.findMany({
      where: { userId: user.id, active: true, scope: "personal" },
      select: { id: true, name: true },
      take: 300
    });
    const duplicate = existing.find((entry) => normalizeName(entry.name) === normalizedName);
    if (duplicate) {
      throw new BadRequestException("A personal investigation list with this name already exists.");
    }

    const ids = [...new Set(dto.investigationCatalogItemIds)];
    const available = await this.prisma.investigationCatalogItem.count({
      where: { id: { in: ids }, active: true }
    });
    if (available !== ids.length) {
      throw new BadRequestException("One or more selected investigations are unavailable.");
    }

    const list = await this.prisma.investigationFavoriteSet.create({
      data: {
        userId: user.id,
        name,
        nameAr: clean(dto.nameAr),
        icon: "investigations",
        scope: "personal",
        branchId: null,
        active: true,
        actionable: true,
        items: {
          create: ids.map((investigationCatalogItemId, position) => ({
            investigationCatalogItemId,
            position
          }))
        }
      },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { investigationCatalogItem: true }
        }
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_favorite_set.created",
      resourceType: "investigation_favorite_set",
      resourceId: list.id,
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { itemCount: ids.length, source: "investigation_station_list_builder" }
    });

    return list;
  }

  @Post("lists/:id/duplicate")
  @Permissions("investigation.read")
  async duplicateList(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const source = await this.prisma.investigationFavoriteSet.findFirst({
      where: { id, userId: user.id, active: true },
      include: { items: { orderBy: { position: "asc" } } }
    });
    if (!source) throw new NotFoundException("Investigation list not found.");

    const existing = await this.prisma.investigationFavoriteSet.findMany({
      where: { userId: user.id, active: true, scope: "personal" },
      select: { name: true },
      take: 300
    });
    const occupied = new Set(existing.map((entry) => normalizeName(entry.name)));
    let suffix = 1;
    let nextName = `${source.name} copy`;
    while (occupied.has(normalizeName(nextName))) {
      suffix += 1;
      nextName = `${source.name} copy ${suffix}`;
    }

    const duplicate = await this.prisma.investigationFavoriteSet.create({
      data: {
        userId: user.id,
        name: nextName,
        nameAr: source.nameAr,
        icon: source.icon,
        scope: "personal",
        branchId: null,
        active: true,
        actionable: true,
        items: {
          create: source.items.map((entry) => ({
            investigationCatalogItemId: entry.investigationCatalogItemId,
            position: entry.position
          }))
        }
      },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { investigationCatalogItem: true }
        }
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_favorite_set.duplicated",
      resourceType: "investigation_favorite_set",
      resourceId: duplicate.id,
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { sourceId: source.id, itemCount: source.items.length }
    });

    return duplicate;
  }

  @Delete("lists/:id")
  @Permissions("investigation.read")
  async archiveList(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const source = await this.prisma.investigationFavoriteSet.findFirst({
      where: { id, userId: user.id, active: true },
      select: { id: true }
    });
    if (!source) throw new NotFoundException("Investigation list not found.");
    const archived = await this.prisma.investigationFavoriteSet.update({
      where: { id },
      data: { active: false }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_favorite_set.archived",
      resourceType: "investigation_favorite_set",
      resourceId: id,
      branchId: user.branchId,
      severity: "medium"
    });
    return archived;
  }
}

function clean(value?: string) {
  const text = value?.trim();
  return text || null;
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
}
