import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DataHygieneService, type ClassifiedResource } from "./data-hygiene.service";

class ClassifyRecordDto {
  @IsIn(["REAL", "TEST", "NEEDS_REVIEW", "QUARANTINED"])
  classification!: "REAL" | "TEST" | "NEEDS_REVIEW" | "QUARANTINED";

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

@Controller("data-hygiene")
@UseGuards(JwtAuthGuard)
export class DataHygieneController {
  constructor(private readonly hygiene: DataHygieneService) {}

  @Get("review")
  review(@CurrentUser() user: AuthUser, @Query("view") view?: string) { return this.hygiene.review(user, view); }

  @Get("report")
  report(@CurrentUser() user: AuthUser) { return this.hygiene.report(user); }

  @Patch(":resource/:id/classification")
  classify(@CurrentUser() user: AuthUser, @Param("resource") resource: ClassifiedResource, @Param("id") id: string, @Body() dto: ClassifyRecordDto) {
    return this.hygiene.classify(user, resource, id, dto.classification, dto.reason);
  }
}
