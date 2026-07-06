import type { NextConfig } from "next";

function normalizeInternalApiOrigin() {
  const origin = (process.env.PRIJ_API_INTERNAL_ORIGIN || "http://localhost:3001").trim().replace(/\/+$/, "");

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new Error("PRIJ_API_INTERNAL_ORIGIN must be a valid internal API origin.");
  }

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

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${normalizeInternalApiOrigin()}/:path*`
      }
    ];
  }
};

export default nextConfig;
