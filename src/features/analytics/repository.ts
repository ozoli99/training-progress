import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  analyticsAthleteDay,
  analyticsSessionFact,
  analyticsWorkoutFact,
  athlete,
  session as sessionTbl,
  setLog,
  workoutLog,
  workoutRoundLog,
  workoutLogEntry,
} from "@/infrastructure/db/schema";
import type {
  TDateRangeInput,
  TKPIResponse,
  TLeaderboardResponse,
  TSessionRow,
  TTrendSeriesResponse,
  TWorkoutBreakdownRow,
} from "./dto";

const toNum = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

const asNumericString = (v: number | null | undefined) =>
  v === null || v === undefined ? null : String(Number(v));

export interface AnalyticsRepository {
  getKpisByOrg(orgId: string, range: TDateRangeInput): Promise<TKPIResponse>;
  getAthleteDaySeries(
    orgId: string,
    athleteId: string | undefined,
    range: TDateRangeInput
  ): Promise<TTrendSeriesResponse>;
  getLeaderboardByVolume(
    orgId: string,
    range: TDateRangeInput,
    limit?: number,
    offset?: number
  ): Promise<TLeaderboardResponse>;
  getWorkoutBreakdown(
    orgId: string,
    range: TDateRangeInput
  ): Promise<TWorkoutBreakdownRow[]>;
  getSessionsByOrg(
    orgId: string,
    range: TDateRangeInput,
    limit: number,
    offset: number
  ): Promise<{ total: number; items: TSessionRow[] }>;
  getSessionKeys(
    sessionId: string
  ): Promise<{ orgId: string; day: string; athleteId: string } | null>;

  upsertSessionFact(sessionId: string): Promise<void>;
  upsertWorkoutFact(workoutLogId: string): Promise<void>;
  recomputeAthleteDay(
    orgId: string,
    day: string,
    athleteId?: string
  ): Promise<void>;
}

export function makeAnalyticsRepository(
  database = defaultDatabase
): AnalyticsRepository {
  return {
    async getKpisByOrg(orgId, { from, to }) {
      const [row] = await database
        .select({
          totalSessions: sql<number>`count(*)`,
          completedSessions: sql<number>`count(*) filter (where ${analyticsSessionFact.completionPct} = 100)`,
          totalSets: sql<number>`coalesce(sum(${analyticsSessionFact.totalSets}),0)`,
          totalVolumeKg: sql<number>`coalesce(sum(${analyticsSessionFact.totalVolumeKg}),0)`,
          totalDurationS: sql<number>`coalesce(sum(${analyticsSessionFact.totalDurationS}),0)`,
          avgRpe: sql<number | null>`avg(${analyticsSessionFact.avgRpe})`,
          avgCompletionPct: sql<
            number | null
          >`avg(${analyticsSessionFact.completionPct})`,
        })
        .from(analyticsSessionFact)
        .where(
          and(
            eq(analyticsSessionFact.orgId, orgId),
            gte(analyticsSessionFact.sessionDate, from),
            lte(analyticsSessionFact.sessionDate, to)
          )
        );

      return {
        totalSessions: Number(row?.totalSessions ?? 0),
        completedSessions: Number(row?.completedSessions ?? 0),
        totalSets: Number(row?.totalSets ?? 0),
        totalVolumeKg: Number(row?.totalVolumeKg ?? 0),
        totalDurationS: Number(row?.totalDurationS ?? 0),
        avgRpe: row?.avgRpe ?? null,
        avgCompletionPct: row?.avgCompletionPct ?? null,
      };
    },

    async getAthleteDaySeries(orgId, athleteId, { from, to }) {
      const rows = await database
        .select({
          day: analyticsAthleteDay.day,
          dayVolumeKg: analyticsAthleteDay.dayVolumeKg,
          dayTimeS: analyticsAthleteDay.dayTimeS,
          rolling7dVolumeKg: analyticsAthleteDay.rolling7dVolumeKg,
          rolling28dVolumeKg: analyticsAthleteDay.rolling28dVolumeKg,
          hrvMs: analyticsAthleteDay.hrvMs,
          sleepH: analyticsAthleteDay.sleepH,
          wellnessScore: analyticsAthleteDay.wellnessScore,
        })
        .from(analyticsAthleteDay)
        .where(
          and(
            eq(analyticsAthleteDay.orgId, orgId),
            athleteId
              ? eq(analyticsAthleteDay.athleteId, athleteId)
              : sql`true`,
            gte(analyticsAthleteDay.day, from),
            lte(analyticsAthleteDay.day, to)
          )
        )
        .orderBy(analyticsAthleteDay.day);

      return {
        athleteId,
        points: rows.map((r) => ({
          day: (r.day as unknown as string) ?? "",
          volumeKg: toNum(r.dayVolumeKg),
          timeS: toNum(r.dayTimeS),
          rolling7dVolumeKg: toNum(r.rolling7dVolumeKg),
          rolling28dVolumeKg: toNum(r.rolling28dVolumeKg),
          hrvMs: toNum(r.hrvMs),
          sleepH: toNum(r.sleepH),
          wellnessScore: toNum(r.wellnessScore),
        })),
      };
    },

    async getLeaderboardByVolume(orgId, { from, to }, limit = 10, offset = 0) {
      const rows = await database
        .select({
          athleteId: analyticsSessionFact.athleteId,
          displayName: athlete.displayName,
          sessions: sql<number>`count(*)`,
          volumeKg: sql<number>`coalesce(sum(${analyticsSessionFact.totalVolumeKg}),0)`,
          timeS: sql<number>`coalesce(sum(${analyticsSessionFact.totalDurationS}),0)`,
        })
        .from(analyticsSessionFact)
        .leftJoin(athlete, eq(athlete.id, analyticsSessionFact.athleteId))
        .where(
          and(
            eq(analyticsSessionFact.orgId, orgId),
            gte(analyticsSessionFact.sessionDate, from),
            lte(analyticsSessionFact.sessionDate, to)
          )
        )
        .groupBy(analyticsSessionFact.athleteId, athlete.displayName)
        .orderBy(
          desc(sql`coalesce(sum(${analyticsSessionFact.totalVolumeKg}),0)`)
        )
        .limit(limit)
        .offset(offset);

      const [countRow] = await database
        .select({
          total: sql<number>`count(distinct ${analyticsSessionFact.athleteId})`,
        })
        .from(analyticsSessionFact)
        .where(
          and(
            eq(analyticsSessionFact.orgId, orgId),
            gte(analyticsSessionFact.sessionDate, from),
            lte(analyticsSessionFact.sessionDate, to)
          )
        );

      return {
        rows: rows.map((r) => ({
          athleteId: r.athleteId,
          displayName: r.displayName ?? null,
          sessions: Number(r.sessions),
          volumeKg: Number(r.volumeKg),
          timeS: Number(r.timeS),
        })),
        total: Number(countRow?.total ?? 0),
      };
    },

    async getWorkoutBreakdown(orgId, { from, to }) {
      // computedAt is a TIMESTAMP → compare with Date
      const fromDt = new Date(`${from}T00:00:00.000Z`);
      const toDt = new Date(`${to}T23:59:59.999Z`);

      const rows = await database
        .select({
          workoutType: analyticsWorkoutFact.workoutType,
          count: sql<number>`count(*)`,
          medianPrimaryResult: sql<
            number | null
          >`percentile_cont(0.5) within group (order by ${analyticsWorkoutFact.resultPrimary})`,
          avgDurationS: sql<
            number | null
          >`avg(${analyticsWorkoutFact.durationS})`,
          avgWorkDensity: sql<
            number | null
          >`avg(${analyticsWorkoutFact.workDensity})`,
        })
        .from(analyticsWorkoutFact)
        .where(
          and(
            eq(analyticsWorkoutFact.orgId, orgId),
            gte(analyticsWorkoutFact.computedAt, fromDt),
            lte(analyticsWorkoutFact.computedAt, toDt)
          )
        )
        .groupBy(analyticsWorkoutFact.workoutType);

      return rows.map((r) => ({
        workoutType: r.workoutType,
        count: Number(r.count),
        medianPrimaryResult: r.medianPrimaryResult,
        avgDurationS: r.avgDurationS,
        avgWorkDensity: r.avgWorkDensity,
      }));
    },

    async getSessionsByOrg(orgId, { from, to }, limit, offset) {
      const [{ count }] = await database
        .select({ count: sql<number>`count(*)` })
        .from(analyticsSessionFact)
        .where(
          and(
            eq(analyticsSessionFact.orgId, orgId),
            gte(analyticsSessionFact.sessionDate, from),
            lte(analyticsSessionFact.sessionDate, to)
          )
        );

      const rows = await database
        .select({
          sessionId: analyticsSessionFact.sessionId,
          athleteId: analyticsSessionFact.athleteId,
          sessionDate: analyticsSessionFact.sessionDate,
          trainingLocationId: analyticsSessionFact.trainingLocationId,
          completionPct: analyticsSessionFact.completionPct,
          totalSets: analyticsSessionFact.totalSets,
          totalVolumeKg: analyticsSessionFact.totalVolumeKg,
          totalDurationS: analyticsSessionFact.totalDurationS,
          avgRpe: analyticsSessionFact.avgRpe,
        })
        .from(analyticsSessionFact)
        .where(
          and(
            eq(analyticsSessionFact.orgId, orgId),
            gte(analyticsSessionFact.sessionDate, from),
            lte(analyticsSessionFact.sessionDate, to)
          )
        )
        .orderBy(desc(analyticsSessionFact.sessionDate))
        .limit(limit)
        .offset(offset);

      return {
        total: Number(count ?? 0),
        items: rows.map((r) => ({
          sessionId: r.sessionId,
          athleteId: r.athleteId,
          sessionDate: r.sessionDate as unknown as string,
          trainingLocationId: r.trainingLocationId ?? null,
          completionPct: r.completionPct ?? null,
          totalSets: r.totalSets ?? null,
          totalVolumeKg: toNum(r.totalVolumeKg),
          totalDurationS: toNum(r.totalDurationS),
          avgRpe: toNum(r.avgRpe),
        })),
      };
    },

    async getSessionKeys(sessionId) {
      const [s] = await database
        .select({
          orgId: sessionTbl.orgId,
          athleteId: sessionTbl.athleteId,
          day: sessionTbl.sessionDate,
        })
        .from(sessionTbl)
        .where(eq(sessionTbl.id, sessionId))
        .limit(1);
      return s ?? null;
    },

    async upsertSessionFact(sessionId) {
      const [s] = await database
        .select({
          id: sessionTbl.id,
          orgId: sessionTbl.orgId,
          athleteId: sessionTbl.athleteId,
          sessionDate: sessionTbl.sessionDate,
          completionPct: sessionTbl.completionPct,
          trainingLocationId: sessionTbl.trainingLocationId,
        })
        .from(sessionTbl)
        .where(eq(sessionTbl.id, sessionId));

      if (!s) return;

      const [agg] = await database
        .select({
          totalSets: sql<number>`count(*)`,
          totalVolumeKg: sql<number>`coalesce(sum(${setLog.reps} * ${setLog.loadKg}),0)`,
          totalDurationS: sql<number>`coalesce(sum(${setLog.durationS}),0)`,
          avgRpe: sql<number | null>`avg(${setLog.rpe})`,
          dominantMovementGroup: sql<string | null>`null`,
          sourceProgramName: sql<string | null>`null`,
        })
        .from(setLog)
        .where(eq(setLog.sessionId, sessionId));

      await database
        .insert(analyticsSessionFact)
        .values({
          sessionId: s.id,
          orgId: s.orgId,
          athleteId: s.athleteId,
          sessionDate: s.sessionDate,
          trainingLocationId: s.trainingLocationId,
          totalSets: Number(agg?.totalSets ?? 0),
          totalVolumeKg: asNumericString(agg?.totalVolumeKg ?? 0),
          totalDurationS: asNumericString(agg?.totalDurationS ?? 0),
          avgRpe: asNumericString(agg?.avgRpe ?? null),
          dominantMovementGroup: agg?.dominantMovementGroup ?? null,
          sourceProgramName: agg?.sourceProgramName ?? null,
          completionPct: s.completionPct ?? 0,
        })
        .onConflictDoUpdate({
          target: analyticsSessionFact.sessionId,
          set: {
            orgId: s.orgId,
            athleteId: s.athleteId,
            sessionDate: s.sessionDate,
            trainingLocationId: s.trainingLocationId,
            totalSets: Number(agg?.totalSets ?? 0),
            totalVolumeKg: asNumericString(agg?.totalVolumeKg ?? 0),
            totalDurationS: asNumericString(agg?.totalDurationS ?? 0),
            avgRpe: asNumericString(agg?.avgRpe ?? null),
            dominantMovementGroup: agg?.dominantMovementGroup ?? null,
            sourceProgramName: agg?.sourceProgramName ?? null,
            completionPct: s.completionPct ?? 0,
            computedAt: sql`now()`,
          },
        });
    },

    async upsertWorkoutFact(workoutLogId) {
      const [wl] = await database
        .select({
          id: workoutLog.id,
          sessionId: workoutLog.sessionId,
          orgId: sessionTbl.orgId,
          athleteId: sessionTbl.athleteId,
          workoutId: workoutLog.workoutId,
          workoutType: sql<
            string | null
          >`(select type from workout where id = ${workoutLog.workoutId})`,
          resultPrimary: workoutLog.resultPrimary,
        })
        .from(workoutLog)
        .leftJoin(sessionTbl, eq(sessionTbl.id, workoutLog.sessionId))
        .where(eq(workoutLog.id, workoutLogId));

      if (!wl) return;

      const [dur] = await database
        .select({
          durationS: sql<
            number | null
          >`coalesce(sum(${workoutRoundLog.durationS}), null)`,
        })
        .from(workoutRoundLog)
        .where(eq(workoutRoundLog.workoutLogId, workoutLogId));

      const [entriesAgg] = await database
        .select({
          totalReps: sql<
            number | null
          >`coalesce(sum(${workoutLogEntry.reps}),0)`,
        })
        .from(workoutLogEntry)
        .where(eq(workoutLogEntry.workoutLogId, workoutLogId));

      const density =
        dur?.durationS && entriesAgg?.totalReps
          ? Number(entriesAgg.totalReps) / Number(dur.durationS)
          : null;

      await database
        .insert(analyticsWorkoutFact)
        .values({
          workoutLogId: wl.id,
          orgId: wl.orgId!,
          athleteId: wl.athleteId!,
          workoutId: wl.workoutId,
          workoutType: wl.workoutType ?? null,
          resultPrimary: asNumericString(
            wl.resultPrimary === null ? null : Number(wl.resultPrimary)
          ),
          durationS: asNumericString(dur?.durationS ?? null),
          workDensity: asNumericString(density),
          movementBreakdown: null,
        })
        .onConflictDoUpdate({
          target: analyticsWorkoutFact.workoutLogId,
          set: {
            orgId: wl.orgId!,
            athleteId: wl.athleteId!,
            workoutId: wl.workoutId,
            workoutType: wl.workoutType ?? null,
            resultPrimary: asNumericString(
              wl.resultPrimary === null ? null : Number(wl.resultPrimary)
            ),
            durationS: asNumericString(dur?.durationS ?? null),
            workDensity: asNumericString(density),
            movementBreakdown: null,
            computedAt: sql`now()`,
          },
        });
    },

    async recomputeAthleteDay(orgId, day, athleteId) {
      const rows = await database
        .select({
          athleteId: analyticsSessionFact.athleteId,
          dayVolumeKg: sql<number>`coalesce(sum(${analyticsSessionFact.totalVolumeKg}),0)`,
          dayTimeS: sql<number>`coalesce(sum(${analyticsSessionFact.totalDurationS}),0)`,
        })
        .from(analyticsSessionFact)
        .where(
          and(
            eq(analyticsSessionFact.orgId, orgId),
            eq(analyticsSessionFact.sessionDate, day),
            athleteId
              ? eq(analyticsSessionFact.athleteId, athleteId)
              : sql`true`
          )
        )
        .groupBy(analyticsSessionFact.athleteId);

      for (const r of rows) {
        await database
          .insert(analyticsAthleteDay)
          .values({
            orgId,
            athleteId: r.athleteId,
            day,
            dayVolumeKg: asNumericString(r.dayVolumeKg),
            dayTimeS: asNumericString(r.dayTimeS),
            rolling7dVolumeKg: null,
            rolling28dVolumeKg: null,
            hrvMs: null,
            sleepH: null,
            wellnessScore: null,
          })
          .onConflictDoUpdate({
            // unique index (athleteId, day) exists in schema → use column target
            target: [analyticsAthleteDay.athleteId, analyticsAthleteDay.day],
            set: {
              dayVolumeKg: asNumericString(r.dayVolumeKg),
              dayTimeS: asNumericString(r.dayTimeS),
              computedAt: sql`now()`,
            },
          });
      }
    },
  };
}

export const analyticsRepository = makeAnalyticsRepository();
