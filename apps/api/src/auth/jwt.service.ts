import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "../config/env";

type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseExpiresIn(value: string) {
  const match = value.match(/^(\d+)([smhd])$/);

  if (!match) {
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? "s") as "s" | "m" | "h" | "d";
  const multipliers: Record<"s" | "m" | "h" | "d", number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24
  };

  return amount * multipliers[unit];
}

@Injectable()
export class AppJwtService {
  sign(user: { id: string; email: string }) {
    const secret = requireEnv("JWT_SECRET");
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = parseExpiresIn(process.env.JWT_EXPIRES_IN ?? "1h");
    const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
    const payload = base64UrlJson({
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + expiresIn
    });
    const signature = this.signParts(header, payload, secret);

    return `${header}.${payload}.${signature}`;
  }

  verify(token: string) {
    const secret = requireEnv("JWT_SECRET");
    const [header, payload, signature] = token.split(".");

    if (!header || !payload || !signature) {
      throw new UnauthorizedException("Invalid token.");
    }

    const expected = this.signParts(header, payload, secret);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException("Invalid token.");
    }

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;

    if (!parsed.sub || parsed.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Token expired.");
    }

    return parsed;
  }

  private signParts(header: string, payload: string, secret: string) {
    return createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  }
}
