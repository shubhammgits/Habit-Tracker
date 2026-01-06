import type { NextResponse } from "next/server";
import cookie from "cookie";
import { verifySessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export function setSessionCookieOnResponse(res: NextResponse, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookieOnResponse(res: NextResponse): void {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const parsed = cookie.parse(header);
  return parsed[SESSION_COOKIE_NAME] ?? null;
}

export function requireUserFromRequest(request: Request): { userId: string; email: string } {
  const token = getSessionTokenFromRequest(request);
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = verifySessionToken(token);
  return { userId: payload.sub, email: payload.email };
}
