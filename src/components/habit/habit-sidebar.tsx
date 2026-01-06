"use client";

import { motion } from "framer-motion";
import type { Habit } from "@/types/habit";
import { cn } from "@/lib/ui/cn";

export function HabitSidebar({
  habits,
  selectedHabitId,
  onSelect,
  onOpenCreate,
}: {
  habits: Habit[];
  selectedHabitId: string | null;
  onSelect: (id: string) => void;
  onOpenCreate: () => void;
}) {
  return (
    <aside className="sticky top-0 h-[100dvh] w-full border-r border-border/60 bg-card/20 backdrop-blur-xl">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Your habits</div>
            <h2 className="text-lg font-semibold tracking-tight">Dashboard</h2>
          </div>
          <button
            onClick={onOpenCreate}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm smooth-transition hover:opacity-95"
          >
            + Add
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {habits.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/30 p-4 text-sm text-muted-foreground">
              Create your first habit.
            </div>
          ) : null}

          {habits.map((h) => {
            const active = h.id === selectedHabitId;
            return (
              <motion.button
                key={h.id}
                onClick={() => onSelect(h.id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left smooth-transition",
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-card/30 hover:bg-card/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium leading-5">{h.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{h.category}</div>
                  </div>
                  <div className={cn("text-xs", h.isActive ? "text-muted-foreground" : "text-destructive")}
                    title={h.isActive ? "Active" : "Disabled"}
                  >
                    {h.isActive ? "" : "Off"}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
