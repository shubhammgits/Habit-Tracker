import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const habitLogSchema = new Schema(
  {
    habitId: { type: Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD in user's local timezone
    completed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

export type HabitLogDoc = InferSchemaType<typeof habitLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const HabitLog: Model<HabitLogDoc> =
  (mongoose.models.HabitLog as Model<HabitLogDoc>) ||
  mongoose.model<HabitLogDoc>("HabitLog", habitLogSchema);
