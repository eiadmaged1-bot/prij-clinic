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
  identifier?: unknown;
  loginId?: unknown;
  password?: unknown;
};

type CookieResponse = {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
  clearCookie(name: string, options: Record<string, unknown>): void;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private extractSessionCookie(request: RequestWithUser): string | undefined {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return undefined;

    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((cookie: string) => {
        const [key, ...valueParts] = cookie.trim().split("=");
        return [key, decodeURIComponent(valueParts.join("="))];
      })
    );
    return cookies.prij_clinic_session;
  }

  @Post("login")
  async login(
    @Body() body: LoginBody,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: CookieResponse
  ) {
    const identifier = body.email ?? body.identifier ?? body.loginId;

    if (typeof identifier !== "string" || typeof body.password !== "string") {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const { user, sessionToken } = await this.auth.login(identifier, body.password, {
      ipAddress: request.ip,
      userAgent: request.get("user-agent") ?? null,
      requestId: request.requestId
    });

    response.cookie("prij_clinic_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.APP_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return { user };
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
    const sessionToken = this.extractSessionCookie(request);

    await this.auth.logout(user.id, user.branchId, {
      ipAddress: request.ip,
      userAgent: request.get("user-agent") ?? null,
      requestId: request.requestId
    }, sessionToken);

    response.clearCookie("prij_clinic_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.APP_ENV === "production",
      path: "/"
    });

    return { status: "ok" };
  }
}
