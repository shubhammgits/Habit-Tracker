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

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    category: z.enum(HabitCategoryValues).optional(),
    frequency: frequencySchema.optional(),
    startDate: z.string().refine(isValidYmd, "Invalid date").optional(),
    reminderTime: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "No updates");

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(request: Request, ctx: { params: Promise<{ habitId: string }> }) {
  const user = requireUserFromRequest(request);
  const { habitId } = await ctx.params;

  await connectToDatabase();

  const habit = await Habit.findOne({ _id: habitId, userId: user.userId }).lean();
  if (!habit) return notFound();

  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const ymd = (date && isValidYmd(date) ? (date as Ymd) : null);

  let completedToday = false;
  if (ymd) {
    const log = await HabitLog.findOne({ habitId: habit._id, date: ymd }).lean();
    completedToday = Boolean(log?.completed);
  }

  return NextResponse.json({
    ok: true,
    habit: {
      id: habit._id.toString(),
      title: habit.title,
      category: habit.category,
      frequency: habit.frequency,
      startDate: new Date(habit.startDate).toISOString().slice(0, 10),
      reminderTime: habit.reminderTime ?? null,
      isActive: Boolean(habit.isActive),
      createdAt: new Date(habit.createdAt).toISOString(),
      updatedAt: new Date(habit.updatedAt).toISOString(),
      completedToday,
    },
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ habitId: string }> }) {
  try {
    enforceSameOrigin(request);
    const user = requireUserFromRequest(request);
    const { habitId } = await ctx.params;
    const body = updateSchema.parse(await request.json());

    await connectToDatabase();

    const update: any = { ...body };
    if (body.startDate) update.startDate = new Date(`${body.startDate}T00:00:00.000Z`);

    const habit = await Habit.findOneAndUpdate({ _id: habitId, userId: user.userId }, update, {
      new: true,
    });

    if (!habit) return notFound();

    return NextResponse.json({
      ok: true,
      habit: {
        id: habit._id.toString(),
        title: habit.title,
        category: habit.category,
        frequency: habit.frequency,
        startDate: habit.startDate.toISOString().slice(0, 10),
        reminderTime: habit.reminderTime ?? null,
        isActive: Boolean(habit.isActive),
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

export async function DELETE(request: Request, ctx: { params: Promise<{ habitId: string }> }) {
  try {
    enforceSameOrigin(request);
    const user = requireUserFromRequest(request);
    const { habitId } = await ctx.params;

    await connectToDatabase();

    const habit = await Habit.findOneAndDelete({ _id: habitId, userId: user.userId });
    if (!habit) return notFound();

    await HabitLog.deleteMany({ habitId: habit._id });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.message === "INVALID_ORIGIN") {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    if (err?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
