import { env } from "@/lib/env";

export function enforceSameOrigin(request: Request): void {
  // Cookie-based auth requires CSRF mitigation.
  // We harden by checking Origin on mutating requests.
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = request.headers.get("origin");
  if (!origin) return; // Some same-origin clients may omit; allow.

  if (process.env.NODE_ENV !== "production") {
    // Dev: allow localhost variants.
    if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) return;
  }

  if (origin !== env.APP_ORIGIN) {
    throw new Error("INVALID_ORIGIN");
  }
}
