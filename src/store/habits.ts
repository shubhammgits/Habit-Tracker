"use client";

import { create } from "zustand";
import type { Habit } from "@/types/habit";

type HabitsState = {
  habits: Habit[];
  selectedHabitId: string | null;
  loading: boolean;
  error: string | null;
  setSelectedHabitId: (id: string | null) => void;
  refresh: (ymd: string) => Promise<void>;
  upsertLocal: (habit: Habit) => void;
  removeLocal: (id: string) => void;
  setCompletedTodayLocal: (id: string, completed: boolean) => void;
};

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: [],
  selectedHabitId: null,
  loading: false,
  error: null,
  setSelectedHabitId: (id) => set({ selectedHabitId: id }),
  refresh: async (ymd) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/habits?date=${encodeURIComponent(ymd)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to load habits");
      }
      const data = await res.json();
      set((s) => {
        const selected = s.selectedHabitId;
        const nextSelected = selected && data.habits.some((h: Habit) => h.id === selected) ? selected : data.habits[0]?.id ?? null;
        return { habits: data.habits as Habit[], selectedHabitId: nextSelected, loading: false };
      });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? "Failed to load habits" });
    }
  },
  upsertLocal: (habit) =>
    set((s) => ({
      habits: [habit, ...s.habits.filter((h) => h.id !== habit.id)],
      selectedHabitId: s.selectedHabitId ?? habit.id,
    })),
  removeLocal: (id) =>
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      selectedHabitId: s.selectedHabitId === id ? (s.habits.find((h) => h.id !== id)?.id ?? null) : s.selectedHabitId,
    })),
  setCompletedTodayLocal: (id, completed) =>
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, completedToday: completed } : h)) })),
}));
