import { BadRequestException, Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthUser } from "../auth/auth.types";
import { UsersService, type UserPreferencePatch } from "./users.service";

const allowed = {
  interfaceMode: new Set(["OPTIMIZED", "MINIMALISTIC"]),
  densityMode: new Set(["COMPACT", "COMFORTABLE", "LARGE"]),
  mobileNavigationMode: new Set(["AUTO", "BOTTOM_NAV", "DRAWER"])
} as const;

@Controller("users/me/preferences")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.users.getPreferences(user.id);
  }

  @Patch()
  update(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    const keys = Object.keys(body);
    if (!keys.length || keys.some((key) => !(key in allowed))) {
      throw new BadRequestException("Unsupported preference field.");
    }
    for (const key of keys as Array<keyof typeof allowed>) {
      if (typeof body[key] !== "string" || !allowed[key].has(body[key] as never)) {
        throw new BadRequestException(`Invalid ${key}.`);
      }
    }
    return this.users.updatePreferences(user.id, body as UserPreferencePatch);
  }
}
