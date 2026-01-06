"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { HabitForm, type HabitFormValue } from "@/components/habit/habit-form";
import type { Habit } from "@/types/habit";

export function HabitCreateModal({
  open,
  onClose,
  defaultStartDate,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultStartDate: string;
  onCreated: (habit: Habit) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(value: HabitFormValue) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: value.title,
          category: value.category,
          frequency: value.frequency,
          startDate: value.startDate,
          reminderTime: value.reminderTime === "" ? undefined : value.reminderTime,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create habit");
      }

      const data = await res.json();
      onCreated(data.habit as Habit);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create habit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create habit">
      <HabitForm
        initial={{ startDate: defaultStartDate }}
        submitLabel="Create habit"
        onSubmit={create}
        onCancel={onClose}
        loading={loading}
        error={error}
      />
    </Modal>
  );
}
