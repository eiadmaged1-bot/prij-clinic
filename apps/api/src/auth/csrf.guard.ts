import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Safe methods bypass CSRF
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Bypass login, health, and swagger endpoints
    if (request.path.includes('/auth/login') || request.path.includes('/health')) {
      return true;
    }

    // The Google Form webhook is authenticated independently with an exact-body
    // HMAC and timestamp/replay checks. It has no browser session or CSRF cookie.
    if (
      request.path === '/external-intake/google-form' &&
      request.headers['x-prij-timestamp'] &&
      request.headers['x-prij-signature']
    ) {
      return true;
    }

    // Check if request is using Bearer token (non-browser legacy clients)
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      return true;
    }

    // Check for CSRF token
    const csrfHeader = request.headers['x-csrf-token'] as string;

    // Read the csrf cookie
    const cookieHeader = request.headers.cookie;
    let csrfCookie: string | undefined;

    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(";").map((cookie: string) => {
          const [key, ...valueParts] = cookie.trim().split("=");
          return [key, decodeURIComponent(valueParts.join("="))];
        })
      );
      csrfCookie = cookies['csrf-token'];
    }

    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      // Return stable error: CSRF_VALIDATION_FAILED
      throw new ForbiddenException({
        code: "CSRF_VALIDATION_FAILED",
        message: "CSRF token missing or invalid."
      });
    }

    return true;
  }
}
