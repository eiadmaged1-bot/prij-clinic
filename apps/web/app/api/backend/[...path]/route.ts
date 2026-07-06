import { NextRequest, NextResponse } from "next/server";

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

function forwardedRequestHeaders(request: NextRequest) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (!hopByHopHeaders.has(normalized) && normalized !== "host" && normalized !== "origin") {
      headers.set(key, value);
    }
  });

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

async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: forwardedRequestHeaders(request),
    redirect: "manual"
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl(request, path), init);
  const responseHeaders = forwardedResponseHeaders(upstream);
  appendSetCookieHeaders(upstream, responseHeaders);

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
