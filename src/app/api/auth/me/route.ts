import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const user = requireUserFromRequest(request);
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
