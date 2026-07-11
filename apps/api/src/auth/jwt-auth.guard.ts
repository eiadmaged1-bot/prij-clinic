import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import type { RequestWithUser } from "./auth.types";
import { AppJwtService } from "./jwt.service";
import { UsersService } from "../users/users.service";
import { SessionService } from "./session.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwt: AppJwtService,
    private readonly users: UsersService,
    private readonly sessionService: SessionService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { token, type } = this.getToken(request) || {};

    if (!token) {
      throw new UnauthorizedException("Authentication is required.");
    }

    let userId: string;

    if (type === "cookie") {
      const session = await this.sessionService.validateSession(token);
      if (!session) {
        throw new UnauthorizedException("Session is invalid or expired.");
      }
      userId = session.userId;
    } else {
      // Legacy JWT fallback for non-browser clients
      this.logger.warn("Legacy Bearer JWT token used for authentication.");
      try {
        const payload = this.jwt.verify(token);
        userId = payload.sub;
      } catch (err) {
        throw new UnauthorizedException("Authentication is required.");
      }
    }

    const user = await this.users.findByIdForAuth(userId);

    if (!user || user.status !== "active") {
      throw new UnauthorizedException("Authentication is required.");
    }

    request.user = this.users.toSafeUser(user);

    return true;
  }

  private getToken(request: RequestWithUser): { token: string; type: "bearer" | "cookie" } | null {
    const authorization = request.headers.authorization;

    if (authorization?.startsWith("Bearer ")) {
      return { token: authorization.slice("Bearer ".length).trim(), type: "bearer" };
    }

    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((cookie: string) => {
        const [key, ...valueParts] = cookie.trim().split("=");
        return [key, decodeURIComponent(valueParts.join("="))];
      })
    );

    if (cookies.prij_clinic_session) {
      return { token: cookies.prij_clinic_session, type: "cookie" };
    }

    return null;
  }
}
