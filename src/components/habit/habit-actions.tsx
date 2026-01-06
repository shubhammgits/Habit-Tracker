"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { Habit } from "@/types/habit";
import { HabitForm, type HabitFormValue } from "@/components/habit/habit-form";

export function HabitActions({
  habit,
  onUpdated,
  onDeleted,
}: {
  habit: Habit;
  onUpdated: (habit: Habit) => void;
  onDeleted: () => void;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(value: HabitFormValue) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/habits/${encodeURIComponent(habit.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: value.title,
          category: value.category,
          frequency: value.frequency,
          startDate: value.startDate,
          reminderTime: value.reminderTime === "" ? null : value.reminderTime,
          isActive: value.isActive ?? habit.isActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update habit");
      }
      const data = await res.json();
      onUpdated({ ...habit, ...data.habit });
      setOpenEdit(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update habit");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/habits/${encodeURIComponent(habit.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !habit.isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update");
      }
      const data = await res.json();
      onUpdated({ ...habit, ...data.habit });
    } catch (e: any) {
      setError(e?.message ?? "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function del() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/habits/${encodeURIComponent(habit.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete");
      }
      onDeleted();
      setOpenDelete(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={toggleActive} disabled={loading}>
          {habit.isActive ? "Disable" : "Enable"}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpenEdit(true)} disabled={loading}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setOpenDelete(true)} disabled={loading}>
          Delete
        </Button>
      </div>

      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title={`Edit: ${habit.title}`}
      >
        <HabitForm
          initial={{
            title: habit.title,
            category: habit.category,
            frequency: habit.frequency,
            startDate: habit.startDate,
            reminderTime: habit.reminderTime,
            isActive: habit.isActive,
          }}
          submitLabel="Save changes"
          onSubmit={save}
          onCancel={() => setOpenEdit(false)}
          loading={loading}
          error={error}
        />
      </Modal>

      <Modal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        title="Delete habit?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenDelete(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={del} disabled={loading}>
              {loading ? "Deleting…" : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">This permanently removes the habit and its history.</p>
        {error ? (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
