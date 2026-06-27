import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RequestWithUser } from "../auth/auth.types";
import { REQUIRED_ROLES_KEY } from "./require-roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const roles = new Set(request.user?.roles ?? []);
    const allowed = required.some((role) => roles.has(role));

    if (!allowed) {
      throw new ForbiddenException("Action is not allowed.");
    }

    return true;
  }
}
