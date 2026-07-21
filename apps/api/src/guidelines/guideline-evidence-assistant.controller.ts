import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IsString, MaxLength, MinLength } from "class-validator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { GuidelineEvidenceAssistantService } from "./guideline-evidence-assistant.service";

class AskApprovedLibraryDto {
  @IsString()
  @MinLength(4)
  @MaxLength(1200)
  question!: string;
}

@Controller("guidelines/evidence-assistant")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GuidelineEvidenceAssistantController {
  constructor(private readonly assistant: GuidelineEvidenceAssistantService) {}

  @Post("ask")
  @Permissions("guidelines.search")
  ask(@Body() dto: AskApprovedLibraryDto, @CurrentUser() user: AuthUser) {
    return this.assistant.answer(dto.question, user);
  }
}
