import { z } from "zod";

export const exerciseUnit = z.enum(["weight_reps", "time", "reps"]);

export const exerciseCreateSchema = z.object({
  name: z.string().min(2, "Name too short"),
  unit: exerciseUnit,
});
export type ExerciseCreate = z.infer<typeof exerciseCreateSchema>;
