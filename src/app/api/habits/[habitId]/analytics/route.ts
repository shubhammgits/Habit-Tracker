import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Habit } from "@/lib/db/models/Habit";
import { HabitLog } from "@/lib/db/models/HabitLog";
import { requireUserFromRequest } from "@/lib/auth/session";
import { isValidYmd, shiftYmd, weekdayFromYmd, type Ymd } from "@/lib/date/ymd";

const querySchema = z.object({
  date: z.string().refine(isValidYmd, "Invalid date"),
  tzOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

function isScheduled(habit: any, date: Ymd, tzOffsetMinutes: number): boolean {
  const start = new Date(habit.startDate);
  const startYmd = start.toISOString().slice(0, 10) as Ymd;
  if (date < startYmd) return false;

  const freq = habit.frequency as any;
  if (freq?.type === "daily") return true;
  const dow = weekdayFromYmd(date, tzOffsetMinutes);
  const days = Array.isArray(freq?.daysOfWeek) ? freq.daysOfWeek : [];
  return days.includes(dow);
}

export async function GET(request: Request, ctx: { params: Promise<{ habitId: string }> }) {
  const user = requireUserFromRequest(request);
  const { habitId } = await ctx.params;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    date: url.searchParams.get("date"),
    tzOffset: url.searchParams.get("tzOffset"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const { date, tzOffset } = parsed.data;
  const asOf = date as Ymd;

  await connectToDatabase();

  const habit = await Habit.findOne({ _id: habitId, userId: user.userId }).lean();
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Pull logs for last ~400 days for streak + charts.
  const start = shiftYmd(asOf, -400, tzOffset);
  const logs = await HabitLog.find({ habitId: habit._id, date: { $gte: start, $lte: asOf } }).lean();
  const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date));

  // Current streak: count consecutive scheduled days completed ending at asOf.
  let currentStreak = 0;
  for (let i = 0; i <= 400; i++) {
    const day = shiftYmd(asOf, -i, tzOffset);
    if (!isScheduled(habit, day, tzOffset)) continue;
    if (!completedSet.has(day)) break;
    currentStreak++;
  }

  // Best streak: scan scheduled days in window.
  let bestStreak = 0;
  let run = 0;
  for (let i = 400; i >= 0; i--) {
    const day = shiftYmd(asOf, -i, tzOffset);
    if (!isScheduled(habit, day, tzOffset)) continue;
    if (completedSet.has(day)) {
      run++;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  // Completion % last 30 scheduled days.
  let scheduled30 = 0;
  let completed30 = 0;
  for (let i = 0; i < 60 && scheduled30 < 30; i++) {
    const day = shiftYmd(asOf, -i, tzOffset);
    if (!isScheduled(habit, day, tzOffset)) continue;
    scheduled30++;
    if (completedSet.has(day)) completed30++;
  }

  // Daily series (last 14 days, scheduled days only)
  const series: Array<{ date: string; completed: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const day = shiftYmd(asOf, -i, tzOffset);
    if (!isScheduled(habit, day, tzOffset)) continue;
    series.push({ date: day, completed: completedSet.has(day) ? 1 : 0 });
  }

  return NextResponse.json({
    ok: true,
    analytics: {
      asOf,
      tzOffset,
      currentStreak,
      bestStreak,
      completionLast30: scheduled30 ? Math.round((completed30 / scheduled30) * 100) : 0,
      series,
    },
  });
}
