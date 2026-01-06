import { NextResponse } from "next/server";
import { clearSessionCookieOnResponse } from "@/lib/auth/session";
import { enforceSameOrigin } from "@/lib/security/origin";

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const res = NextResponse.json({ ok: true });
    clearSessionCookieOnResponse(res);
    return res;
  } catch (err: any) {
    if (err?.message === "INVALID_ORIGIN") {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
