// features/analytics/dto.ts
import { z } from "zod";

/* --------------------------- Common primitives --------------------------- */
export const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const DateRangeInput = z.object({
  from: DateOnly,
  to: DateOnly,
});

export const OrgScopedInput = z.object({
  orgId: z.string().uuid(),
});

export const RecomputeForSessionInput = z.object({
  sessionId: z.string().uuid(),
});

export const RecomputeForWorkoutLogInput = z.object({
  workoutLogId: z.string().uuid(),
});

export const RecomputeDailyInput = OrgScopedInput.extend({
  athleteId: z.string().uuid().optional(),
  day: DateOnly,
});

/* ------------------------------ Read models ----------------------------- */
// KPI cards
export const KPIResponse = z.object({
  totalSessions: z.number().int(),
  completedSessions: z.number().int(),
  totalSets: z.number().int(),
  totalVolumeKg: z.number(),
  totalDurationS: z.number(),
  avgRpe: z.number().nullable(),
  avgCompletionPct: z.number().nullable(),
});

// Trends
export const DayPoint = z.object({
  day: DateOnly,
  volumeKg: z.number().nullable(),
  timeS: z.number().nullable(),
  rolling7dVolumeKg: z.number().nullable(),
  rolling28dVolumeKg: z.number().nullable(),
  hrvMs: z.number().nullable(),
  sleepH: z.number().nullable(),
  wellnessScore: z.number().nullable(),
});
export const TrendSeriesResponse = z.object({
  athleteId: z.string().uuid().optional(),
  points: z.array(DayPoint),
});

// Leaderboard
export const LeaderboardRow = z.object({
  athleteId: z.string().uuid(),
  displayName: z.string().nullable(),
  sessions: z.number().int(),
  volumeKg: z.number(),
  timeS: z.number(),
});
export const LeaderboardResponse = z.object({
  rows: z.array(LeaderboardRow),
  total: z.number().int(),
});

// Workout breakdown
export const WorkoutBreakdownRow = z.object({
  workoutType: z.string().nullable(),
  count: z.number().int(),
  medianPrimaryResult: z.number().nullable(),
  avgDurationS: z.number().nullable(),
  avgWorkDensity: z.number().nullable(),
});

// --- Sessions list (per-session rows from analyticsSessionFact) ---
export const PaginationInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const SessionRow = z.object({
  sessionId: z.string().uuid(),
  athleteId: z.string().uuid(),
  sessionDate: DateOnly,
  trainingLocationId: z.string().uuid().nullable(),
  completionPct: z.number().int().nullable(),
  totalSets: z.number().int().nullable(),
  totalVolumeKg: z.number().nullable(),
  totalDurationS: z.number().nullable(),
  avgRpe: z.number().nullable(),
});

export const SessionsResponse = z.object({
  total: z.number().int(),
  items: z.array(SessionRow),
});

export type TSessionsResponse = z.infer<typeof SessionsResponse>;
export type TSessionRow = z.infer<typeof SessionRow>;
export type TDateRangeInput = z.infer<typeof DateRangeInput>;
export type TKPIResponse = z.infer<typeof KPIResponse>;
export type TTrendSeriesResponse = z.infer<typeof TrendSeriesResponse>;
export type TLeaderboardResponse = z.infer<typeof LeaderboardResponse>;
export type TWorkoutBreakdownRow = z.infer<typeof WorkoutBreakdownRow>;
