"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";
import type { Habit } from "@/types/habit";
import { getLocalYmd, getTzOffsetMinutes, isScheduledOnDate } from "@/lib/date/client";
import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from "date-fns";
import { motion } from "framer-motion";

type AnalyticsResponse =
  | {
      ok: true;
      analytics: {
        asOf: string;
        tzOffset: number;
        currentStreak: number;
        bestStreak: number;
        completionLast30: number;
        series: Array<{ date: string; completed: number }>;
      };
    }
  | { error: string };

type LogsResponse =
  | { ok: true; logs: Array<{ id: string; habitId: string; date: string; completed: boolean }> }
  | { error: string };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export function HabitAnalytics({ habit }: { habit: Habit }) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [logsByDate, setLogsByDate] = useState<Record<string, boolean>>({});

  const asOf = useMemo(() => getLocalYmd(), []);
  const tzOffset = useMemo(() => getTzOffsetMinutes(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setData(null);
      const res = await fetch(
        `/api/habits/${encodeURIComponent(habit.id)}/analytics?date=${encodeURIComponent(asOf)}&tzOffset=${encodeURIComponent(
          tzOffset
        )}`
      );
      const json = (await res.json().catch(() => ({ error: "Failed" }))) as AnalyticsResponse;
      if (cancelled) return;
      setData(json);
    })();
    return () => {
      cancelled = true;
    };
  }, [habit.id, asOf, tzOffset]);

  const calendarRange = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 0 });
    return { start, end };
  }, [monthCursor]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fetch logs for the visible calendar month grid.
      const start = format(calendarRange.start, "yyyy-MM-dd");
      const end = format(calendarRange.end, "yyyy-MM-dd");
      const res = await fetch(
        `/api/habits/${encodeURIComponent(habit.id)}/logs?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
      const json = (await res.json().catch(() => ({ error: "Failed" }))) as LogsResponse;
      if (cancelled) return;
      if ((json as any).ok !== true) {
        setLogsByDate({});
        return;
      }
      const map: Record<string, boolean> = {};
      for (const l of (json as any).logs as Array<{ date: string; completed: boolean }>) {
        map[l.date] = Boolean(l.completed);
      }
      setLogsByDate(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [habit.id, calendarRange.end, calendarRange.start]);

  const ok = (data as any)?.ok === true;
  const analytics = ok ? (data as any).analytics : null;

  const weekDays = useMemo(() => {
    const end = new Date();
    const days: Array<{ ymd: string; label: string }> = [];
    for (let i = 0; i < 7; i++) {
      const d = subDays(end, 6 - i);
      days.push({ ymd: format(d, "yyyy-MM-dd"), label: format(d, "EEE") });
    }
    return days;
  }, []);

  const weekStats = useMemo(() => {
    let scheduled = 0;
    let completed = 0;
    const items = weekDays.map((d) => {
      const scheduledToday = isScheduledOnDate(habit, d.ymd, tzOffset);
      const done = logsByDate[d.ymd] === true;
      if (scheduledToday) {
        scheduled++;
        if (done) completed++;
      }
      return { ...d, scheduled: scheduledToday, completed: done };
    });
    return { scheduled, completed, items };
  }, [habit, logsByDate, tzOffset, weekDays]);

  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; ymd: string }> = [];
    const cursor = new Date(calendarRange.start);
    while (cursor <= calendarRange.end) {
      days.push({ date: new Date(cursor), ymd: format(cursor, "yyyy-MM-dd") });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [calendarRange.end, calendarRange.start]);

  return (
    <Card className="mt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Analytics</h3>
          <p className="text-sm text-muted-foreground">Streaks and completion trends.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Current streak" value={analytics ? String(analytics.currentStreak) : "…"} />
        <Stat label="Best streak" value={analytics ? String(analytics.bestStreak) : "…"} />
        <Stat label="Completion (last 30)" value={analytics ? `${analytics.completionLast30}%` : "…"} />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card/35 p-3">
        <div className="mb-2 text-xs text-muted-foreground">Last scheduled days</div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics?.series ?? []} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis hide domain={[0, 1]} />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  color: "white",
                }}
                formatter={(v: any) => (v === 1 ? "Completed" : "Missed")}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium">This week</div>
        <p className="text-xs text-muted-foreground">Scheduled days only.</p>

        <div className="mt-3 rounded-xl border border-border bg-card/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {weekStats.completed}/{weekStats.scheduled} completed
            </div>
            <div className="text-xs text-muted-foreground">
              {weekStats.scheduled ? Math.round((weekStats.completed / weekStats.scheduled) * 100) : 0}%
            </div>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-foreground/10">
            <div
              className="h-2 rounded-full bg-primary smooth-transition"
              style={{ width: `${weekStats.scheduled ? (weekStats.completed / weekStats.scheduled) * 100 : 0}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekStats.items.map((d) => (
              <div key={d.ymd} className="text-center">
                <div className="text-[10px] text-muted-foreground">{d.label}</div>
                <div
                  className={cn(
                    "mt-2 h-9 rounded-lg border border-border",
                    !d.scheduled && "bg-card/15 opacity-70",
                    d.scheduled && d.completed && "bg-primary/20",
                    d.scheduled && !d.completed && "bg-card/30"
                  )}
                  title={d.ymd}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Monthly calendar</div>
            <p className="text-xs text-muted-foreground">Color-coded scheduled completion states.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonthCursor((m) => addMonths(m, -1))}
              className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm hover:bg-foreground/5"
              aria-label="Previous month"
            >
              Prev
            </button>
            <div className="text-sm font-medium">{format(monthCursor, "MMMM yyyy")}</div>
            <button
              type="button"
              onClick={() => setMonthCursor((m) => addMonths(m, 1))}
              className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm hover:bg-foreground/5"
              aria-label="Next month"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        <motion.div
          key={format(monthCursor, "yyyy-MM")}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="mt-2 grid grid-cols-7 gap-2"
        >
          {calendarDays.map((d) => {
            const inMonth = d.date.getMonth() === monthCursor.getMonth();
            const scheduled = isScheduledOnDate(habit, d.ymd, tzOffset);
            const done = logsByDate[d.ymd] === true;
            const beforeStart = d.ymd < habit.startDate;

            return (
              <div
                key={d.ymd}
                title={d.ymd}
                className={cn(
                  "relative h-11 rounded-xl border border-border bg-card/20 p-2 smooth-transition",
                  !inMonth && "opacity-60",
                  beforeStart && "opacity-50",
                  scheduled && done && "bg-primary/20",
                  scheduled && !done && "bg-card/35",
                  !scheduled && "bg-card/15",
                  "hover:bg-foreground/5"
                )}
              >
                <div className="text-[10px] text-muted-foreground">{d.date.getDate()}</div>
                {scheduled ? (
                  <div
                    className={cn(
                      "absolute bottom-2 right-2 h-2 w-2 rounded-full",
                      done ? "bg-primary" : "bg-foreground/20"
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </motion.div>
      </div>
    </Card>
  );
}
