const localApiBaseUrl = "http://localhost:3001";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function publicApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
}

function serverApiUrl() {
  return process.env.API_URL ?? publicApiUrl() ?? localApiBaseUrl;
}

export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return trimTrailingSlash(serverApiUrl());
  }

  const { hostname, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return trimTrailingSlash(publicApiUrl() ?? localApiBaseUrl);
  }

  return `${protocol}//${hostname}:3001`;
}

export const apiUnreachableMessage =
  "Cannot reach Prij API from this device. Open http://SERVER-IP:3001/health or restart the app with LAN mode.";
