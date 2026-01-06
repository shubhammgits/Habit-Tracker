import type { Habit, HabitFrequency } from "@/types/habit";

export function getLocalYmd(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTzOffsetMinutes(now = new Date()): number {
  // JS returns minutes behind UTC (e.g. IST is -330). We want the same sign.
  return now.getTimezoneOffset();
}

export function isScheduledOnDate(habit: Habit, ymd: string, tzOffsetMinutes: number): boolean {
  if (ymd < habit.startDate) return false;

  const freq: HabitFrequency = habit.frequency;
  if (freq.type === "daily") return true;

  const [yy, mm, dd] = ymd.split("-").map(Number);
  const utcMs = Date.UTC(yy, mm - 1, dd) - tzOffsetMinutes * 60_000;
  const dow = new Date(utcMs).getUTCDay();

  return freq.daysOfWeek.includes(dow);
}
