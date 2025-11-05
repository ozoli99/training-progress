import { z } from "zod";

export const HydrateQuery = z.object({
  includeSets: z.coerce.boolean().default(true),
  includeWorkouts: z.coerce.boolean().default(true),
});
export type HydrateQuery = z.infer<typeof HydrateQuery>;

export type HydratedSession = {
  session: {
    id: string;
    orgId: string;
    athleteId: string;
    sessionDate: string;
    status: string | null;
    completionPct: number | null;
    loadSource: string | null;
    trainingLocationId: string | null;
    plannedSessionId: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
  };
  blocks: Array<{
    id: string;
    sessionId: string;
    blockIndex: number;
    blockType: string | null;
    title: string | null;
    notes: string | null;
    sets: Array<{
      id: string;
      sessionId: string;
      sessionBlockId: string | null;
      exerciseId: string;
      setIndex: number;
      reps: number | null;
      loadKg: string | null;
      durationS: string | null;
      distanceM: string | null;
      rpe: string | null;
      toFailure: boolean | null;
    }>;
  }>;
  workouts: Array<{
    id: string;
    sessionId: string;
    sessionBlockId: string | null;
    workoutId: string;
    plannedWorkoutId: string | null;
    workoutVersionId: string | null;
    resultRaw: string | null;
    resultPrimary: string | null;
    asRx: boolean;
    isDraft: boolean;
  }>;
};
