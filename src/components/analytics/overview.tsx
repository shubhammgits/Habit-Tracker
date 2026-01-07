"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";

type OverviewResponse =
  | {
      ok: true;
      overview: {
        asOf: string;
        tzOffset: number;
        activeHabits: number;
        completionLast30: number;
        perfectStreak: number;
        last14: Array<{ date: string; completionRate: number }>;
        badges: Array<{ id: string; title: string; description: string }>;
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

export function OverviewWidget({ ymd, tzOffset }: { ymd: string; tzOffset: number }) {
  const [data, setData] = useState<OverviewResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/analytics/overview?date=${encodeURIComponent(ymd)}&tzOffset=${encodeURIComponent(tzOffset)}`
      );
      const json = (await res.json().catch(() => ({ error: "Failed" }))) as OverviewResponse;
      if (cancelled) return;
      setData(json);
    })();
    return () => {
      cancelled = true;
    };
  }, [ymd, tzOffset]);

  const overview = data && "ok" in data && data.ok ? data.overview : null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">All active habits, last 14 days trend.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Active habits" value={overview ? String(overview.activeHabits) : "…"} />
        <Stat label="Completion (last 30)" value={overview ? `${overview.completionLast30}%` : "…"} />
        <Stat label="Perfect-day streak" value={overview ? String(overview.perfectStreak) : "…"} />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card/35 p-3">
        <div className="mb-2 text-xs text-muted-foreground">Completion rate (last 14)</div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={overview?.last14 ?? []} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis hide domain={[0, 1]} />
              <Tooltip formatter={(v: any) => `${Math.round(Number(v) * 100)}%`} />
              <Area
                type="monotone"
                dataKey="completionRate"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.25)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {overview?.badges?.length ? (
        <div className="mt-4">
          <div className="text-sm font-medium">Badges</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {overview.badges.map((b: { id: string; title: string; description: string }) => (
              <span
                key={b.id}
                title={b.description}
                className="inline-flex items-center rounded-full border border-border bg-primary/10 px-3 py-1 text-xs"
              >
                {b.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
