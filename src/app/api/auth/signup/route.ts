import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { hashPassword } from "@/lib/auth/password";
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

    const existing = await User.findOne({ email: body.email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(body.password);
    const user = await User.create({ email: body.email, hashedPassword });

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
