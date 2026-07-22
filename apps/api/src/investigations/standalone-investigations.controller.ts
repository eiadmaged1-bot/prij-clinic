import { Body, Controller, ForbiddenException, Post, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from "class-validator";
import { InvestigationCategory, InvestigationPriority, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { PrismaService } from "../prisma/prisma.service";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";

class StandaloneInvestigationItemDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  requestType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestNote?: string;
}

class CreateStandaloneInvestigationOrderDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsEnum(InvestigationPriority)
  priority?: InvestigationPriority;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requestNote?: string;

  @IsOptional()
  @IsDateString()
  requestedFollowUpDate?: string;

  @IsOptional()
  @IsDateString()
  expectedResultDate?: string;

  @IsOptional()
  @IsIn(["internal", "external"])
  internalExternal?: "internal" | "external";

  @IsOptional()
  @IsObject()
  responsibilityJson?: Record<string, unknown>;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StandaloneInvestigationItemDto)
  items!: StandaloneInvestigationItemDto[];
}

@Controller("investigations/standalone-orders")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StandaloneInvestigationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  @Post()
  @Permissions("investigation.create")
  async create(@Body() dto: CreateStandaloneInvestigationOrderDto, @CurrentUser() user: AuthUser) {
    const clinician = user.roles.some((role) => role === "Doctor" || role === "Owner");
    if (!clinician) {
      throw new ForbiddenException("Standalone investigation orders require Doctor or Owner authority.");
    }

    await assertCanReferencePatient(this.prisma, dto.patientId, user);

    const order = await this.prisma.investigationOrder.create({
      data: {
        patientId: dto.patientId,
        encounterId: null,
        doctorId: user.id,
        priority: dto.priority ?? "routine",
        notes: clean(dto.requestNote),
        requestedFollowUpDate: dto.requestedFollowUpDate ? new Date(dto.requestedFollowUpDate) : null,
        expectedResultDate: dto.expectedResultDate ? new Date(dto.expectedResultDate) : null,
        internalExternal: dto.internalExternal ?? "internal",
        responsibilityJson: dto.responsibilityJson as Prisma.InputJsonValue | undefined,
        lifecycleHistoryJson: [
          {
            status: "requested",
            actorUserId: user.id,
            at: new Date().toISOString(),
            reason: "Doctor submitted standalone patient order"
          }
        ],
        items: {
          create: dto.items.map((item) => ({
            category: mapRequestType(item.requestType),
            testName: item.title.trim(),
            instructions: clean(item.requestNote)
          }))
        }
      } as Prisma.InvestigationOrderUncheckedCreateInput,
      include: { items: true, patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_order.created_standalone",
      resourceType: "investigation_order",
      resourceId: order.id,
      branchId: user.branchId,
      severity: "high",
      metadataJson: {
        patientId: order.patientId,
        encounterId: null,
        itemCount: order.items.length,
        catalogItemIds: dto.items.map((item) => item.catalogItemId).filter(Boolean),
        priority: order.priority,
        source: "investigation_station"
      }
    });

    return order;
  }
}

function clean(value?: string) {
  const text = value?.trim();
  return text || null;
}

function mapRequestType(value?: string): InvestigationCategory {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("ultrasound") || key.includes("sonograph")) return "ultrasound";
  if (key.includes("radiology") || key.includes("imaging") || key.includes("mri") || key.includes("ct") || key.includes("x-ray") || key.includes("xray")) return "radiology";
  if (key.includes("pathology") || key.includes("cytology") || key.includes("histopathology")) return "pathology";
  if (key.includes("procedure") || key.includes("referral") || key.includes("cardiac") || key.includes("functional")) return "procedure";
  return "laboratory";
}
