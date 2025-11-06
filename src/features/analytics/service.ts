import {
  DateRangeInput,
  KPIResponse,
  TrendSeriesResponse,
  LeaderboardResponse,
  WorkoutBreakdownRow,
  RecomputeForSessionInput,
  RecomputeForWorkoutLogInput,
  RecomputeDailyInput,
  type TWorkoutBreakdownRow,
  SessionsResponse,
  PaginationInput,
} from "./dto";
import { analyticsRepository, type AnalyticsRepository } from "./repository";

/* ------------------------------- Service --------------------------------- */
// Stateless orchestrator. Encapsulation via module boundaries + Zod.

export function makeAnalyticsService(repository: AnalyticsRepository) {
  return {
    /* ---------------------------- Public reads ---------------------------- */
    async getDashboardKpis(input: { orgId: string; range: unknown }) {
      const range = DateRangeInput.parse(input.range);
      const data = await repository.getKpisByOrg(input.orgId, range);
      return KPIResponse.parse(data);
    },

    async getAthleteTrend(input: {
      orgId: string;
      athleteId?: string;
      range: unknown;
    }) {
      const range = DateRangeInput.parse(input.range);
      const data = await repository.getAthleteDaySeries(
        input.orgId,
        input.athleteId,
        range
      );
      return TrendSeriesResponse.parse(data);
    },

    async getLeaderboard(input: {
      orgId: string;
      range: unknown;
      limit?: number;
      offset?: number;
    }) {
      const range = DateRangeInput.parse(input.range);
      const data = await repository.getLeaderboardByVolume(
        input.orgId,
        range,
        input.limit ?? 10,
        input.offset ?? 0
      );
      return LeaderboardResponse.parse(data);
    },

    async getWorkoutBreakdown(input: {
      orgId: string;
      range: unknown;
    }): Promise<TWorkoutBreakdownRow[]> {
      const range = DateRangeInput.parse(input.range);
      const rows = await repository.getWorkoutBreakdown(input.orgId, range);
      return rows.map((r) => WorkoutBreakdownRow.parse(r));
    },

    async getSessions(input: {
      orgId: string;
      range: unknown;
      limit?: number;
      offset?: number;
    }) {
      const range = DateRangeInput.parse(input.range);
      const { limit, offset } = PaginationInput.parse({
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
      });

      const data = await repository.getSessionsByOrg(
        input.orgId,
        range,
        limit,
        offset
      );
      return SessionsResponse.parse(data);
    },

    /* ----------------------------- Writers/ETL --------------------------- */
    async recomputeForSession(input: unknown) {
      const { sessionId } = RecomputeForSessionInput.parse(input);
      await repository.upsertSessionFact(sessionId);

      const followup = await repository.getSessionKeys(sessionId);
      if (followup) {
        const { orgId, day, athleteId } = followup;
        await repository.recomputeAthleteDay(orgId, day, athleteId);
      }
    },

    async recomputeForWorkoutLog(input: unknown) {
      const { workoutLogId } = RecomputeForWorkoutLogInput.parse(input);
      await repository.upsertWorkoutFact(workoutLogId);
    },

    async recomputeDaily(input: unknown) {
      const { orgId, day, athleteId } = RecomputeDailyInput.parse(input);
      await repository.recomputeAthleteDay(orgId, day, athleteId);
    },
  };
}

/* ----------------------- Default concrete service ------------------------ */
export const analyticsService = makeAnalyticsService(analyticsRepository);
export type AnalyticsService = ReturnType<typeof makeAnalyticsService>;
