import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Habit, HabitCategoryValues } from "@/lib/db/models/Habit";
import { HabitLog } from "@/lib/db/models/HabitLog";
import { requireUserFromRequest } from "@/lib/auth/session";
import { enforceSameOrigin } from "@/lib/security/origin";
import { isValidYmd, type Ymd } from "@/lib/date/ymd";

const frequencySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({ type: z.literal("weekly"), daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1) }),
  z.object({ type: z.literal("custom"), daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1) }),
]);

const createSchema = z.object({
  title: z.string().trim().min(1).max(80),
  category: z.enum(HabitCategoryValues),
  frequency: frequencySchema,
  startDate: z.string().refine(isValidYmd, "Invalid date"),
  reminderTime: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/).optional(),
});

export async function GET(request: Request) {
  const user = requireUserFromRequest(request);
  await connectToDatabase();

  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const ymd = (date && isValidYmd(date) ? (date as Ymd) : null);

  const habits = await Habit.find({ userId: user.userId }).sort({ createdAt: -1 }).lean();

  let todayByHabitId: Record<string, boolean> = {};
  if (ymd) {
    const logs = await HabitLog.find({ habitId: { $in: habits.map((h) => h._id) }, date: ymd }).lean();
    todayByHabitId = Object.fromEntries(logs.map((l) => [l.habitId.toString(), Boolean(l.completed)]));
  }

  return NextResponse.json({
    ok: true,
    habits: habits.map((h) => ({
      id: h._id.toString(),
      userId: h.userId.toString(),
      title: h.title,
      category: h.category,
      frequency: h.frequency,
      startDate: new Date(h.startDate).toISOString().slice(0, 10),
      reminderTime: h.reminderTime ?? null,
      isActive: Boolean(h.isActive),
      createdAt: new Date(h.createdAt).toISOString(),
      updatedAt: new Date(h.updatedAt).toISOString(),
      completedToday: ymd ? Boolean(todayByHabitId[h._id.toString()]) : false,
    })),
  });
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const user = requireUserFromRequest(request);
    const body = createSchema.parse(await request.json());

    await connectToDatabase();

    const habit = await Habit.create({
      userId: user.userId,
      title: body.title,
      category: body.category,
      frequency: body.frequency,
      startDate: new Date(`${body.startDate}T00:00:00.000Z`),
      reminderTime: body.reminderTime,
      isActive: true,
    });

    return NextResponse.json({
      ok: true,
      habit: {
        id: habit._id.toString(),
        title: habit.title,
        category: habit.category,
        frequency: habit.frequency,
        startDate: body.startDate,
        reminderTime: habit.reminderTime ?? null,
        isActive: habit.isActive,
        createdAt: habit.createdAt.toISOString(),
        updatedAt: habit.updatedAt.toISOString(),
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
