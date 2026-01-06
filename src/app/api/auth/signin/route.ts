import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/jwt";
import { setSessionCookieOnResponse } from "@/lib/auth/session";
import { enforceSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const body = schema.parse(await request.json());

    await connectToDatabase();

    const user = await User.findOne({ email: body.email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(body.password, user.hashedPassword);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signSessionToken({ userId: user._id.toString(), email: user.email });
    const res = NextResponse.json({ ok: true, user: { id: user._id.toString(), email: user.email } });
    setSessionCookieOnResponse(res, token);
    return res;
  } catch (err: any) {
    if (err?.message === "INVALID_ORIGIN") {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
