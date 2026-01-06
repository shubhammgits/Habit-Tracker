import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1).default("habit-tracker"),
  JWT_AUDIENCE: z.string().min(1).default("habit-tracker-web"),
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export const env = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ISSUER: process.env.JWT_ISSUER ?? "habit-tracker",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE ?? "habit-tracker-web",
  APP_ORIGIN: process.env.APP_ORIGIN ?? "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV,
});
