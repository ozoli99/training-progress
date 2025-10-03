import { z } from "zod";

const setSchema = z.object({
    reps: z.number().int().positive().optional(),
    weight: z.number().positive().optional(),
    timeSec: z.number().int().positive().optional(),
    rpe: z.number().min(1).max(10).optional(),
}).refine(s => s.timeSec || (s.reps && s.weight) || s.reps, {
    message: "Provide time or reps and weight or reps",
});

export const logCreateSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    exerciseId: z.string(),
    notes: z.string().max(500).optional(),
    sets: z.array(setSchema).min(1, "At least one set is required"),
});
export type LogCreate = z.infer<typeof logCreateSchema>;