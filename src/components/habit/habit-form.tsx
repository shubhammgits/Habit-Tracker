"use client";

import * as React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Habit, HabitCategory, HabitFrequency } from "@/types/habit";
import { cn } from "@/lib/ui/cn";

const categories: HabitCategory[] = ["Health", "Study", "Fitness", "Productivity", "Custom"];

const frequencySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({ type: z.literal("weekly"), daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1) }),
  z.object({ type: z.literal("custom"), daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1) }),
]);

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(80),
  category: z.enum(["Health", "Study", "Fitness", "Productivity", "Custom"]),
  frequency: frequencySchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  reminderTime: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/, "Invalid time").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

const days = [
  { v: 0, label: "Sun" },
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
];

function toggleDay(current: number[], day: number): number[] {
  return current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
}

export type HabitFormValue = z.infer<typeof schema>;

export function HabitForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  error,
  loading,
}: {
  initial: Partial<Habit> & { startDate: string };
  submitLabel: string;
  onSubmit: (value: HabitFormValue) => void;
  onCancel: () => void;
  error: string | null;
  loading: boolean;
}) {
  const [title, setTitle] = React.useState(initial.title ?? "");
  const [category, setCategory] = React.useState<HabitCategory>((initial.category as HabitCategory) ?? "Health");
  const [startDate, setStartDate] = React.useState(initial.startDate);
  const [reminderTime, setReminderTime] = React.useState(initial.reminderTime ?? "");
  const [freqType, setFreqType] = React.useState<HabitFrequency["type"]>(initial.frequency?.type ?? "daily");
  const [daysOfWeek, setDaysOfWeek] = React.useState<number[]>(
    initial.frequency && initial.frequency.type !== "daily" ? initial.frequency.daysOfWeek : [1, 2, 3, 4, 5]
  );

  const validation = React.useMemo(() => {
    const frequency: HabitFrequency =
      freqType === "daily" ? { type: "daily" } : { type: freqType, daysOfWeek };

    return schema.safeParse({
      title,
      category,
      startDate,
      reminderTime,
      frequency,
      isActive: initial.isActive ?? true,
    });
  }, [title, category, startDate, reminderTime, freqType, daysOfWeek, initial.isActive]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.success) return;
    onSubmit(validation.data);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm">Habit name</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 20 min walk" />
        {!validation.success ? (
          <p className="text-xs text-destructive">
            {validation.error.issues.find((i) => i.path[0] === "title")?.message ?? ""}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm">Category</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value as HabitCategory)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Start date</label>
          <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm">Frequency</label>
          <Select value={freqType} onChange={(e) => setFreqType(e.target.value as any)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom days</option>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Reminder time (optional)</label>
          <Input value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} type="time" />
        </div>
      </div>

      {freqType !== "daily" ? (
        <div className="space-y-2">
          <label className="text-sm">Days</label>
          <div className="flex flex-wrap gap-2">
            {days.map((d) => {
              const active = daysOfWeek.includes(d.v);
              return (
                <button
                  type="button"
                  key={d.v}
                  onClick={() => setDaysOfWeek((cur) => toggleDay(cur, d.v))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs smooth-transition",
                    active
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-card/40 text-muted-foreground hover:bg-foreground/5"
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          {!validation.success ? (
            <p className="text-xs text-destructive">
              {validation.error.issues.find((i) => i.path[0] === "frequency")?.message ?? ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !validation.success}>
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
