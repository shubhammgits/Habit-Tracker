"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/ui/cn";
import type { Habit } from "@/types/habit";
import { getLocalYmd, getTzOffsetMinutes } from "@/lib/date/client";

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

  const ok = (data as any)?.ok === true;
  const analytics = ok ? (data as any).analytics : null;

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

      <div className="mt-4">
        <div className="text-sm font-medium">History</div>
        <p className="text-xs text-muted-foreground">Green = completed, gray = missed.</p>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {(analytics?.series ?? []).slice(-28).map((d: { date: string; completed: number }) => (
            <div
              key={d.date}
              title={d.date}
              className={cn(
                "h-9 rounded-lg border border-border smooth-transition",
                d.completed === 1 ? "bg-primary/20" : "bg-card/30"
              )}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
