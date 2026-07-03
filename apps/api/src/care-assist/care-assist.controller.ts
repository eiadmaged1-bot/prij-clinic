import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CareAssistRuleService } from "./care-assist-rule.service";
import { CareAssistService } from "./care-assist.service";
import { DecisionCareAssistDto } from "./dto/decision-care-assist.dto";
import { EvaluateCareAssistDto } from "./dto/evaluate-care-assist.dto";
import { SearchMedicationSafetyProfilesDto } from "./dto/search-medication-safety-profiles.dto";
import { MedicationPregnancyLactationSafetyService } from "./medication-pregnancy-lactation-safety.service";

@Controller("care-assist")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CareAssistController {
  constructor(
    private readonly careAssist: CareAssistService,
    private readonly rules: CareAssistRuleService
  ) {}

  @Get("rules")
  @Permissions("care_assist.manage")
  async listRules() {
    return { rules: await this.rules.list() };
  }

  @Post("evaluate")
  @Permissions("care_assist.evaluate")
  evaluate(@Body() dto: EvaluateCareAssistDto, @CurrentUser() user: AuthUser) {
    return this.careAssist.evaluate(dto, user);
  }

  @Get("findings")
  @Permissions("care_assist.read")
  async findings(@Query("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { findings: await this.careAssist.listFindings(patientId, user) };
  }

  @Post("findings/:id/decision")
  @Permissions("care_assist.decide")
  decide(@Param("id") id: string, @Body() dto: DecisionCareAssistDto, @CurrentUser() user: AuthUser) {
    return this.careAssist.decide(id, dto, user);
  }
}

@Controller("reference")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MedicationSafetyProfilesController {
  constructor(private readonly profiles: MedicationPregnancyLactationSafetyService) {}

  @Get("medications/:id/safety-profile")
  @Permissions("care_assist.read", "medications.safety_check")
  safetyProfile(@Param("id") id: string) {
    return this.profiles.getProfile(id);
  }

  @Get("medication-safety-profiles/search")
  @Permissions("care_assist.read", "medications.safety_check")
  async search(@Query() query: SearchMedicationSafetyProfilesDto) {
    return { results: await this.profiles.search(query) };
  }

  @Patch("medications/:id/safety-profile")
  @Permissions("medication_safety_profile.manage")
  update(@Param("id") id: string, @Body() dto: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.profiles.updateProfile(id, dto, user);
  }
}
