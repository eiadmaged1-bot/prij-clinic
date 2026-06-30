import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CloseReferralDto, CreateReferralDto, UpdateReferralDto } from "./dto";
import { ReferralsService } from "./referrals.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get("referrals")
  @Permissions("referral.read")
  async list(@CurrentUser() user: AuthUser) {
    return { referrals: await this.referrals.list(user) };
  }

  @Post("referrals")
  @Permissions("referral.create")
  create(@Body() dto: CreateReferralDto, @CurrentUser() user: AuthUser) {
    return this.referrals.create(dto, user);
  }

  @Get("referrals/:id")
  @Permissions("referral.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.referrals.get(id, user);
  }

  @Patch("referrals/:id")
  @Permissions("referral.update")
  update(@Param("id") id: string, @Body() dto: UpdateReferralDto, @CurrentUser() user: AuthUser) {
    return this.referrals.update(id, dto, user);
  }

  @Post("referrals/:id/close")
  @Permissions("referral.close")
  close(@Param("id") id: string, @Body() dto: CloseReferralDto, @CurrentUser() user: AuthUser) {
    return this.referrals.close(id, dto, user);
  }

  @Get("patients/:patientId/referrals")
  @Permissions("referral.read")
  async listForPatient(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { referrals: await this.referrals.listForPatient(patientId, user) };
  }
}
