import { BadRequestException, Body, Controller, ForbiddenException, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthUser } from "../auth/auth.types";
import { UsersService, type UserPreferencePatch } from "./users.service";

const allowed = {
  interfaceMode: new Set(["OPTIMIZED", "MINIMALISTIC"]),
  densityMode: new Set(["COMPACT", "COMFORTABLE", "LARGE"]),
  mobileNavigationMode: new Set(["AUTO", "BOTTOM_NAV", "DRAWER"]),
  doctorWorkspaceMode: new Set(["CLASSIC", "COCKPIT"])
} as const;
const appearanceKeys = new Set(["themeId", "accent", "sidebar", "typography", "fontScale", "density", "cardRadius", "shadow", "border", "tableDensity", "iconDensity", "reducedMotion", "contrast"]);
const themeIds = new Set(["prij-heritage", "clinic-premium", "lavender", "rose", "minimal-clean", "compact-operations", "high-contrast"]);

@Controller("users/me/preferences")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.users.getPreferences(user.id);
  }

  @Get("appearance")
  appearance(@CurrentUser() user: AuthUser) { return this.users.resolveAppearance(user); }

  @Patch()
  update(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    const keys = Object.keys(body);
    if (!keys.length || keys.some((key) => !(key in allowed) && key !== "appearanceJson")) {
      throw new BadRequestException("Unsupported preference field.");
    }
    for (const key of keys.filter((key) => key !== "appearanceJson") as Array<keyof typeof allowed>) {
      if (typeof body[key] !== "string" || !allowed[key].has(body[key] as never)) {
        throw new BadRequestException(`Invalid ${key}.`);
      }
    }
    if ("doctorWorkspaceMode" in body && !user.roles.some((role) => role === "Doctor" || role === "Owner")) {
      throw new ForbiddenException("Doctor workspace preferences are available to doctors and owners only.");
    }
    if ("appearanceJson" in body && !validAppearance(body.appearanceJson)) throw new BadRequestException("Invalid appearance preference.");
    return this.users.updatePreferences(user.id, body as UserPreferencePatch);
  }
}

function validAppearance(value: unknown) { if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !appearanceKeys.has(key))) return false; const candidate = value as Record<string, unknown>; return themeIds.has(String(candidate.themeId ?? "")) && (candidate.accent === undefined || /^#[0-9a-f]{6}$/i.test(String(candidate.accent))) && (candidate.fontScale === undefined || (typeof candidate.fontScale === "number" && candidate.fontScale >= .8 && candidate.fontScale <= 1.5)) && (candidate.cardRadius === undefined || (typeof candidate.cardRadius === "number" && candidate.cardRadius >= 0 && candidate.cardRadius <= 32)); }
