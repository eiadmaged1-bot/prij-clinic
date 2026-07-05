const securityHeaders: Record<string, string> = {
  "Cache-Control": "no-store",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

type HeaderResponse = {
  setHeader(name: string, value: string): void;
};

export function securityHeadersMiddleware(_request: unknown, response: HeaderResponse, next: () => void) {
  for (const [header, value] of Object.entries(securityHeaders)) {
    response.setHeader(header, value);
  }

  next();
}
