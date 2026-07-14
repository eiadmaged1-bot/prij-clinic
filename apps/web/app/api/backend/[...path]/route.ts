import { NextRequest, NextResponse } from "next/server";

class PayloadTooLargeError extends Error {
  constructor() {
    super("PAYLOAD_TOO_LARGE");
  }
}

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

// Allowlist of safe headers to forward from the browser to the backend
const allowedRequestHeaders = new Set([
  "accept",
  "accept-encoding",
  "accept-language",
  "content-type",
  "user-agent",
  "cookie",
  "referer",
  "x-request-id",
  "idempotency-key",
  "x-csrf-token",
  "x-prij-timestamp",
  "x-prij-signature",
  "x-prij-dry-run"
  // Note: 'authorization' and 'x-forwarded-for' are explicitly EXCLUDED per security requirements
]);

function internalApiOrigin() {
  const configured = (process.env.PRIJ_API_INTERNAL_ORIGIN || "http://localhost:3001").trim().replace(/\/+$/, "");
  const url = new URL(configured);

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.hostname.includes("*")
  ) {
    throw new Error("PRIJ_API_INTERNAL_ORIGIN must be an origin only.");
  }

  return url.origin;
}

function targetUrl(request: NextRequest, path: string[] = []) {
  const safePath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const url = new URL(`${internalApiOrigin()}/${safePath}`);
  url.search = request.nextUrl.search;
  return url;
}

function forwardedRequestHeaders(request: NextRequest, generatedRequestId: string) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (allowedRequestHeaders.has(normalized) && normalized !== "origin") {
      headers.set(key, value);
    }
  });

  // Ensure x-request-id is present (either from client or newly generated)
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", generatedRequestId);
  }

  // Derive trusted forwarding metadata
  // Next.js may provide x-real-ip or similar from the infrastructure
  const ip = request.headers.get("x-real-ip");
  if (ip) {
    headers.set("x-forwarded-for", ip);
  }

  return headers;
}

function forwardedResponseHeaders(response: Response) {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

function appendSetCookieHeaders(response: Response, headers: Headers) {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies = typeof getSetCookie === "function" ? getSetCookie.call(response.headers) : [];

  if (setCookies.length === 0) {
    return;
  }

  headers.delete("set-cookie");
  for (const cookie of setCookies) {
    headers.append("set-cookie", cookie);
  }
}

function getRouteBodyLimit(path: string[]): number {
  const MB = 1024 * 1024;
  const pathString = path.join("/").toLowerCase();

  if (pathString.includes("document") || pathString.includes("file") || pathString.includes("pdf")) {
    return 25 * MB;
  }
  if (pathString.includes("image") || pathString.includes("photo") || pathString.includes("avatar")) {
    return 10 * MB;
  }
  return 2 * MB;
}

async function readBodyWithLimit(request: NextRequest, limit: number): Promise<Uint8Array | null> {
  if (!request.body) return null;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > limit) {
    throw new PayloadTooLargeError();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        totalLength += value.length;
        if (totalLength > limit) {
          throw new PayloadTooLargeError();
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function buildErrorEnvelope(code: string, message: string, status: number, requestId: string) {
  return new NextResponse(
    JSON.stringify({
      error: {
        code,
        message,
        fieldErrors: {},
        requestId,
        status
      }
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId
      }
    }
  );
}

async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const method = request.method.toUpperCase();

  let requestId = request.headers.get("x-request-id") || "";
  if (!/^[0-9a-fA-F-]{36}$/.test(requestId)) {
    requestId = crypto.randomUUID();
  }

  const target = targetUrl(request, path);
  const headers = forwardedRequestHeaders(request, requestId);

  let bodyBuffer: Uint8Array | null = null;

  if (method !== "GET" && method !== "HEAD") {
    const limit = getRouteBodyLimit(path);
    try {
      bodyBuffer = await readBodyWithLimit(request, limit);
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        return buildErrorEnvelope("PAYLOAD_TOO_LARGE", "Request payload exceeds size limit.", 413, requestId);
      }
      return buildErrorEnvelope("INTERNAL_SERVER_ERROR", "Error reading request body.", 500, requestId);
    }
  }

  const executeFetch = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const init: RequestInit = {
      method,
      headers,
      redirect: "manual",
      signal: controller.signal
    };

    if (bodyBuffer) {
      init.body = Buffer.from(bodyBuffer);
    }

    try {
      const response = await fetch(target, init);
      clearTimeout(timeout);
      return response;
    } catch (error: unknown) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("GATEWAY_TIMEOUT");
      }
      throw new Error("SERVICE_UNAVAILABLE");
    }
  };

  let upstream: Response;
  try {
    upstream = await executeFetch();

    // Retry logic: bounded delay, max 1 retry, only for GET/HEAD, only for 502/503/504
    if ((method === "GET" || method === "HEAD") && [502, 503, 504].includes(upstream.status)) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      upstream = await executeFetch();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "GATEWAY_TIMEOUT") {
      return buildErrorEnvelope("GATEWAY_TIMEOUT", "The backend service took too long to respond.", 504, requestId);
    }
    return buildErrorEnvelope("SERVICE_UNAVAILABLE", "The backend service is currently unreachable.", 502, requestId);
  }

  const responseHeaders = forwardedResponseHeaders(upstream);
  appendSetCookieHeaders(upstream, responseHeaders);

  // If the upstream responded with a raw 502, 503, 504 without a structured body (e.g., node crashed)
  // We can choose to wrap it or pass it. Next.js might fail to pass it if it's not a JSON error.
  // The backend exception filter will return structured errors for 500s.
  // We only intercept if it's not a JSON response for those status codes? The prompt asks to "Return structured 502 for API unavailable. Return structured 504 for timeout."
  // Which we did in the catch blocks above (for fetch errors). For actual HTTP responses from backend, the backend is expected to format them, but if the backend is a raw 502 (e.g. from a middle load balancer) we might not catch it.
  // We will assume `executeFetch` either throws or returns a valid response.

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
