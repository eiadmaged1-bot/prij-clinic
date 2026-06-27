import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { RequestWithUser } from "./auth.types";
import { AppJwtService } from "./jwt.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: AppJwtService,
    private readonly users: UsersService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.getToken(request);

    if (!token) {
      throw new UnauthorizedException("Authentication is required.");
    }

    const payload = this.jwt.verify(token);
    const user = await this.users.findByIdForAuth(payload.sub);

    if (!user || user.status !== "active") {
      throw new UnauthorizedException("Authentication is required.");
    }

    request.user = this.users.toSafeUser(user);

    return true;
  }

  private getToken(request: RequestWithUser) {
    const authorization = request.headers.authorization;

    if (authorization?.startsWith("Bearer ")) {
      return authorization.slice("Bearer ".length).trim();
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

    return cookies.prij_clinic_session ?? null;
  }
}
