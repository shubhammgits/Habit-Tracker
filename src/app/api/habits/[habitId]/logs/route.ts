import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Habit } from "@/lib/db/models/Habit";
import { HabitLog } from "@/lib/db/models/HabitLog";
import { requireUserFromRequest } from "@/lib/auth/session";
import { enforceSameOrigin } from "@/lib/security/origin";
import { isValidYmd, type Ymd } from "@/lib/date/ymd";

const postSchema = z.object({
  date: z.string().refine(isValidYmd, "Invalid date"),
  completed: z.boolean(),
});

export async function GET(request: Request, ctx: { params: Promise<{ habitId: string }> }) {
  const user = requireUserFromRequest(request);
  const { habitId } = await ctx.params;

  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  await connectToDatabase();

  const habit = await Habit.findOne({ _id: habitId, userId: user.userId }).lean();
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const query: any = { habitId: habit._id };
  if (start && isValidYmd(start) && end && isValidYmd(end)) {
    query.date = { $gte: start as Ymd, $lte: end as Ymd };
  }

  const logs = await HabitLog.find(query).sort({ date: 1 }).lean();

  return NextResponse.json({
    ok: true,
    logs: logs.map((l) => ({
      id: l._id.toString(),
      habitId: l.habitId.toString(),
      date: l.date,
      completed: Boolean(l.completed),
    })),
  });
}

export async function POST(request: Request, ctx: { params: Promise<{ habitId: string }> }) {
  try {
    enforceSameOrigin(request);
    const user = requireUserFromRequest(request);
    const { habitId } = await ctx.params;
    const body = postSchema.parse(await request.json());

    await connectToDatabase();

    const habit = await Habit.findOne({ _id: habitId, userId: user.userId }).lean();
    if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const log = await HabitLog.findOneAndUpdate(
      { habitId: habit._id, date: body.date as Ymd },
      { $set: { completed: body.completed } },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      ok: true,
      log: {
        id: log._id.toString(),
        habitId: log.habitId.toString(),
        date: log.date,
        completed: Boolean(log.completed),
      },
    });
  } catch (err: any) {
    if (err?.message === "INVALID_ORIGIN") {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    if (err?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
