"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useMe } from "@/hooks/api/use-me";
import { useHabitsStore } from "@/store/habits";
import { isScheduledOnDate } from "@/lib/date/client";
import { useToday } from "@/hooks/use-today";
import { HabitSidebar } from "@/components/habit/habit-sidebar";
import { HabitCreateModal } from "@/components/habit/habit-create-modal";
import { HabitCheck } from "@/components/habit/habit-check";
import { HabitAnalytics } from "@/components/habit/habit-analytics";
import { HabitActions } from "@/components/habit/habit-actions";
import { OverviewWidget } from "@/components/analytics/overview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Habit } from "@/types/habit";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card/40 px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const { email } = useMe();
  const { ymd, tzOffset } = useToday();

  const { habits, selectedHabitId, setSelectedHabitId, refresh, loading, error, upsertLocal, removeLocal, setCompletedTodayLocal } =
    useHabitsStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);

  useEffect(() => {
    refresh(ymd);
  }, [refresh, ymd]);

  const selected = useMemo(() => habits.find((h) => h.id === selectedHabitId) ?? null, [habits, selectedHabitId]);

  const todayHabits = useMemo(() => {
    return habits
      .filter((h) => h.isActive)
      .filter((h) => isScheduledOnDate(h, ymd, tzOffset));
  }, [habits, ymd, tzOffset]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/signin";
  }

  async function toggleToday(habit: Habit) {
    if (toggleBusyId) return;
    setToggleBusyId(habit.id);
    const next = !Boolean(habit.completedToday);
    setCompletedTodayLocal(habit.id, next);
    try {
      const res = await fetch(`/api/habits/${encodeURIComponent(habit.id)}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: ymd, completed: next }),
      });
      if (!res.ok) {
        setCompletedTodayLocal(habit.id, !next);
      }
    } finally {
      setToggleBusyId(null);
    }
  }

  async function exportCsv() {
    const url = `/api/export/csv?date=${encodeURIComponent(ymd)}&tzOffset=${encodeURIComponent(tzOffset)}&days=180`;
    const res = await fetch(url);
    if (!res.ok) return;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `habit-tracker-export_${ymd}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }

  return (
    <main className="min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
        <HabitSidebar
          habits={habits}
          selectedHabitId={selectedHabitId}
          onSelect={(id) => setSelectedHabitId(id)}
          onOpenCreate={() => setCreateOpen(true)}
        />

        <div className="min-h-screen">
          <div className="sticky top-0 z-40 border-b border-border/60 bg-background/60 backdrop-blur-xl">
            <div className="mx-auto max-w-5xl px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Signed in</div>
                  <div className="text-sm font-medium">{email ?? "…"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Button variant="secondary" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-6 py-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">Today</h1>
                    <p className="text-sm text-muted-foreground">{ymd} (local)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={exportCsv}>
                      Export CSV
                    </Button>
                    <Button onClick={() => setCreateOpen(true)}>Create habit</Button>
                  </div>
                </div>

                {error ? (
                  <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                {loading ? (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-14 rounded-xl border border-border bg-foreground/5 animate-pulse-soft" />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {todayHabits.length === 0 ? (
                      <div className="rounded-xl border border-border bg-card/30 p-4 text-sm text-muted-foreground">
                        No scheduled habits for today. Create one, or adjust frequency.
                      </div>
                    ) : null}

                    {todayHabits.map((h) => (
                      <motion.div
                        key={h.id}
                        whileHover={{ y: -1 }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/30 px-4 py-3 smooth-transition hover:bg-card/50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{h.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge>{h.category}</Badge>
                            {!h.isActive ? <Badge>Disabled</Badge> : null}
                          </div>
                        </div>
                        <HabitCheck
                          checked={Boolean(h.completedToday)}
                          disabled={toggleBusyId === h.id}
                          onToggle={() => toggleToday(h)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>

              <div className="mt-4">
                <OverviewWidget ymd={ymd} tzOffset={tzOffset} />
              </div>

              {selected ? (
                <Card className="mt-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold tracking-tight">{selected.title}</h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge>{selected.category}</Badge>
                        <Badge>{selected.isActive ? "Active" : "Disabled"}</Badge>
                        {selected.reminderTime ? <Badge>Reminds {selected.reminderTime}</Badge> : null}
                        <Badge>Start {selected.startDate}</Badge>
                      </div>
                    </div>
                    <HabitActions
                      habit={selected}
                      onUpdated={(h) => upsertLocal(h)}
                      onDeleted={() => removeLocal(selected.id)}
                    />
                  </div>

                  <HabitAnalytics habit={selected} />
                </Card>
              ) : (
                <Card className="mt-4">
                  <h2 className="text-lg font-semibold tracking-tight">Select a habit</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Pick one from the sidebar to see analytics and manage it.</p>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <HabitCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultStartDate={ymd}
        onCreated={(habit) => {
          upsertLocal(habit);
          setSelectedHabitId(habit.id);
          refresh(ymd);
        }}
      />
    </main>
  );
}
