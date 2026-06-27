import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthUser, RequestWithUser } from "./auth.types";
import { AuthService } from "./auth.service";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

type CookieResponse = {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
  clearCookie(name: string, options: Record<string, unknown>): void;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  async login(
    @Body() body: LoginBody,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: CookieResponse
  ) {
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const result = await this.auth.login(body.email, body.password, {
      ipAddress: request.ip,
      userAgent: request.get("user-agent") ?? null
    });

    response.cookie("prij_clinic_session", result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.APP_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 1000
    });

    return result;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthUser,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: CookieResponse
  ) {
    await this.auth.logout(user.id, user.branchId, {
      ipAddress: request.ip,
      userAgent: request.get("user-agent") ?? null
    });

    response.clearCookie("prij_clinic_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.APP_ENV === "production",
      path: "/"
    });

    return { status: "ok" };
  }
}
