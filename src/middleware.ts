import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

function isAuthed(req: NextRequest): boolean {
  return Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedPage = pathname.startsWith("/dashboard");
  const protectedApi = pathname.startsWith("/api") && !pathname.startsWith("/api/auth");

  if (!protectedPage && !protectedApi) return NextResponse.next();

  if (!isAuthed(req)) {
    if (protectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
