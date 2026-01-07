import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUserFromRequest } from "@/lib/auth/session";
import { Habit } from "@/lib/db/models/Habit";
import { HabitLog } from "@/lib/db/models/HabitLog";
import { isValidYmd, shiftYmd, type Ymd } from "@/lib/date/ymd";

const querySchema = z.object({
  date: z.string().refine(isValidYmd, "Invalid date"),
  tzOffset: z.coerce.number().int().min(-840).max(840).default(0),
  days: z.coerce.number().int().min(1).max(3650).default(180),
});

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (/[\n\r,"]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const user = requireUserFromRequest(request);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    date: url.searchParams.get("date"),
    tzOffset: url.searchParams.get("tzOffset"),
    days: url.searchParams.get("days"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const asOf = parsed.data.date as Ymd;
  const tzOffset = parsed.data.tzOffset;
  const days = parsed.data.days;

  await connectToDatabase();

  const habits = await Habit.find({ userId: user.userId }).lean();
  const habitById = new Map(habits.map((h) => [h._id.toString(), h]));

  const start = shiftYmd(asOf, -days, tzOffset);
  const logs = await HabitLog.find({ habitId: { $in: habits.map((h) => h._id) }, date: { $gte: start, $lte: asOf } })
    .sort({ date: 1 })
    .lean();

  const header = [
    "date",
    "habitId",
    "habitTitle",
    "category",
    "completed",
    "startDate",
    "frequency",
    "reminderTime",
    "isActive",
  ];

  const rows: string[] = [];
  rows.push(header.join(","));

  for (const l of logs) {
    const h = habitById.get(l.habitId.toString());
    rows.push(
      [
        l.date,
        l.habitId.toString(),
        h?.title ?? "",
        h?.category ?? "",
        l.completed ? "true" : "false",
        h?.startDate ? new Date(h.startDate).toISOString().slice(0, 10) : "",
        h?.frequency ? JSON.stringify(h.frequency) : "",
        h?.reminderTime ?? "",
        h?.isActive ? "true" : "false",
      ].map(csvEscape).join(",")
    );
  }

  const csv = rows.join("\n") + "\n";
  const filename = `habit-tracker-export_${asOf}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Cache-Control": "no-store",
    },
  });
}
