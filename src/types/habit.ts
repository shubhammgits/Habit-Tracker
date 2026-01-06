export type HabitCategory = "Health" | "Study" | "Fitness" | "Productivity" | "Custom";

export type HabitFrequency =
  | { type: "daily" }
  | { type: "weekly"; daysOfWeek: number[] }
  | { type: "custom"; daysOfWeek: number[] };

export type Habit = {
  id: string;
  userId: string;
  title: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  startDate: string; // YYYY-MM-DD
  reminderTime: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completedToday?: boolean;
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
};
