import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUserFromRequest } from "@/lib/auth/session";
import { Habit } from "@/lib/db/models/Habit";
import { HabitLog } from "@/lib/db/models/HabitLog";
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
  const days = Array.isArray(freq?.daysOfWeek) ? (freq.daysOfWeek as number[]) : [];
  return days.includes(dow);
}

export async function GET(request: Request) {
  const user = requireUserFromRequest(request);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    date: url.searchParams.get("date"),
    tzOffset: url.searchParams.get("tzOffset"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const asOf = parsed.data.date as Ymd;
  const tzOffset = parsed.data.tzOffset;

  await connectToDatabase();

  const habits = await Habit.find({ userId: user.userId, isActive: true }).lean();
  const habitIds = habits.map((h) => h._id);

  // Pull last 60 days of completed logs for aggregation.
  const start = shiftYmd(asOf, -60, tzOffset);
  const logs = await HabitLog.find({ habitId: { $in: habitIds }, date: { $gte: start, $lte: asOf } }).lean();

  const completedByKey = new Set<string>();
  for (const l of logs) {
    if (l.completed) completedByKey.add(`${l.habitId.toString()}|${l.date}`);
  }

  const last14: Array<{ date: string; completionRate: number }> = [];

  let scheduled30 = 0;
  let completed30 = 0;

  function dayStats(day: Ymd) {
    let scheduled = 0;
    let completed = 0;
    for (const h of habits) {
      if (!isScheduled(h, day, tzOffset)) continue;
      scheduled++;
      if (completedByKey.has(`${h._id.toString()}|${day}`)) completed++;
    }
    return { scheduled, completed };
  }

  // last 30 calendar days (scheduled habit-days)
  for (let i = 0; i < 30; i++) {
    const day = shiftYmd(asOf, -i, tzOffset);
    const s = dayStats(day);
    scheduled30 += s.scheduled;
    completed30 += s.completed;
  }

  // Last 14 series (chronological)
  for (let i = 13; i >= 0; i--) {
    const day = shiftYmd(asOf, -i, tzOffset);
    const s = dayStats(day);
    last14.push({ date: day, completionRate: s.scheduled ? s.completed / s.scheduled : 0 });
  }

  // Perfect-day streak: consecutive days where every scheduled habit was completed.
  let perfectStreak = 0;
  for (let i = 0; i <= 60; i++) {
    const day = shiftYmd(asOf, -i, tzOffset);
    const s = dayStats(day);
    if (i === 0) {
      if (s.scheduled > 0 && s.completed === s.scheduled) perfectStreak = 1;
    } else if (perfectStreak > 0) {
      if (s.scheduled > 0 && s.completed === s.scheduled) perfectStreak++;
      else break;
    }
  }

  const completionLast30 = scheduled30 ? Math.round((completed30 / scheduled30) * 100) : 0;

  const badges: Array<{ id: string; title: string; description: string }> = [];
  if (perfectStreak >= 3) badges.push({ id: "perfect-3", title: "3-day perfect streak", description: "Completed every scheduled habit for 3 days." });
  if (perfectStreak >= 7) badges.push({ id: "perfect-7", title: "7-day perfect streak", description: "A full week of perfect days." });
  if (completionLast30 >= 80) badges.push({ id: "consistency-80", title: "80% consistency", description: "80%+ completion across recent scheduled checks." });

  return NextResponse.json({
    ok: true,
    overview: {
      asOf,
      tzOffset,
      activeHabits: habits.length,
      completionLast30,
      perfectStreak,
      last14,
      badges,
    },
  });
}
