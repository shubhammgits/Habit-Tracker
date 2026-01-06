import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const HabitCategoryValues = [
  "Health",
  "Study",
  "Fitness",
  "Productivity",
  "Custom",
] as const;

export type HabitCategory = (typeof HabitCategoryValues)[number];

type Frequency =
  | { type: "daily" }
  | { type: "weekly"; daysOfWeek: number[] } // 0=Sun..6=Sat
  | { type: "custom"; daysOfWeek: number[] };

const habitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, enum: HabitCategoryValues },
    frequency: {
      type: Object,
      required: true,
    },
    startDate: { type: Date, required: true },
    reminderTime: { type: String, required: false }, // "HH:mm" local
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

habitSchema.index({ userId: 1, createdAt: -1 });

export type HabitDoc = InferSchemaType<typeof habitSchema> & {
  _id: mongoose.Types.ObjectId;
  frequency: Frequency;
};

export const Habit: Model<HabitDoc> =
  (mongoose.models.Habit as Model<HabitDoc>) || mongoose.model<HabitDoc>("Habit", habitSchema);
