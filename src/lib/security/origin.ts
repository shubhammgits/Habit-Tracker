import { getEnv } from "@/lib/env";

function getRequestOrigin(request: Request): string | null {
  try {
    // Prefer forwarded headers (common on proxies), otherwise fall back to Host.
    const headers = request.headers;
    const host = headers.get("x-forwarded-host") ?? headers.get("host");
    if (!host) return null;
    const proto = headers.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    return `${proto}://${host}`;
  } catch {
    return null;
  }
}

export function enforceSameOrigin(request: Request): void {
  // Cookie-based auth requires CSRF mitigation.
  // We harden by checking Origin on mutating requests.
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = request.headers.get("origin");
  if (!origin) return; // Some same-origin clients may omit; allow.

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new Error("INVALID_ORIGIN");
  }

  if (process.env.NODE_ENV !== "production") {
    // Dev: allow same-host origins (localhost, LAN IP, custom hosts).
    const requestOrigin = getRequestOrigin(request);
    if (requestOrigin && origin === requestOrigin) return;

    // Also allow localhost variants.
    if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") return;
  }

  const env = getEnv();
  if (origin !== env.APP_ORIGIN) {
    throw new Error("INVALID_ORIGIN");
  }
}
