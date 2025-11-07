import { and, eq, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  intervalLog,
  session as SessionTbl,
  type intervalLog as IntervalTbl,
} from "@/infrastructure/db/schema";
import type { TIntervalRow, TListIntervalsInput } from "./dto";

const toDbNumeric = (v: number | null | undefined) =>
  v === undefined ? undefined : v === null ? null : String(v);

export interface IntervalsRepository {
  list(input: TListIntervalsInput): Promise<TIntervalRow[]>;
  get(input: {
    orgId: string;
    athleteId: string;
    sessionId: string;
    intervalLogId: string;
  }): Promise<TIntervalRow | null>;
  create(input: {
    orgId: string;
    athleteId: string;
    sessionId: string;
    sessionBlockId?: string;
    exerciseId?: string;
    intervalIndex: number;
    targetValue?: unknown;
    durationS?: number;
    notes?: string;
  }): Promise<TIntervalRow>;
  update(input: {
    orgId: string;
    athleteId: string;
    sessionId: string;
    intervalLogId: string;
    sessionBlockId?: string | null;
    exerciseId?: string | null;
    intervalIndex?: number;
    targetValue?: unknown | null;
    actualValue?: unknown | null;
    durationS?: number | null;
    notes?: string | null;
  }): Promise<TIntervalRow>;
  delete(input: {
    orgId: string;
    athleteId: string;
    sessionId: string;
    intervalLogId: string;
  }): Promise<void>;
}

export function makeIntervalsRepository(
  database = defaultDatabase
): IntervalsRepository {
  return {
    async list({ orgId, athleteId, sessionId, sessionBlockId }) {
      const [sess] = await database
        .select({ id: SessionTbl.id })
        .from(SessionTbl)
        .where(
          and(
            eq(SessionTbl.id, sessionId),
            eq(SessionTbl.orgId, orgId),
            eq(SessionTbl.athleteId, athleteId)
          )
        )
        .limit(1);

      if (!sess) return [];

      const where = and(
        eq(intervalLog.sessionId, sessionId),
        sessionBlockId
          ? eq(intervalLog.sessionBlockId, sessionBlockId)
          : sql`true`
      );

      const rows = await database
        .select()
        .from(intervalLog)
        .where(where)
        .orderBy(intervalLog.intervalIndex);

      return rows.map(mapIntervalRow);
    },

    async get({ orgId, athleteId, sessionId, intervalLogId }) {
      const rows = await database
        .select({
          il: intervalLog,
        })
        .from(intervalLog)
        .innerJoin(SessionTbl, eq(SessionTbl.id, intervalLog.sessionId))
        .where(
          and(
            eq(intervalLog.id, intervalLogId),
            eq(intervalLog.sessionId, sessionId),
            eq(SessionTbl.orgId, orgId),
            eq(SessionTbl.athleteId, athleteId)
          )
        )
        .limit(1);

      const row = rows[0]?.il;
      return row ? mapIntervalRow(row) : null;
    },

    async create({
      orgId,
      athleteId,
      sessionId,
      sessionBlockId,
      exerciseId,
      intervalIndex,
      targetValue,
      durationS,
      notes,
    }) {
      const [sess] = await database
        .select({ id: SessionTbl.id })
        .from(SessionTbl)
        .where(
          and(
            eq(SessionTbl.id, sessionId),
            eq(SessionTbl.orgId, orgId),
            eq(SessionTbl.athleteId, athleteId)
          )
        )
        .limit(1);
      if (!sess) {
        throw new Error("Session not found for given org/athlete.");
      }

      const [created] = await database
        .insert(intervalLog)
        .values({
          sessionId,
          sessionBlockId: sessionBlockId ?? null,
          exerciseId: exerciseId ?? null,
          intervalIndex,
          targetValue: targetValue ?? null,
          actualValue: null,
          durationS: toDbNumeric(durationS),
          notes: notes ?? null,
        })
        .returning();

      return mapIntervalRow(created);
    },

    async update({
      orgId,
      athleteId,
      sessionId,
      intervalLogId,
      sessionBlockId,
      exerciseId,
      intervalIndex,
      targetValue,
      actualValue,
      durationS,
      notes,
    }) {
      const existing = await this.get({
        orgId,
        athleteId,
        sessionId,
        intervalLogId,
      });
      if (!existing) {
        throw new Error("Interval not found or access denied.");
      }

      const [updated] = await database
        .update(intervalLog)
        .set({
          sessionBlockId:
            sessionBlockId === undefined
              ? sql`${intervalLog.sessionBlockId}`
              : (sessionBlockId as any),
          exerciseId:
            exerciseId === undefined
              ? sql`${intervalLog.exerciseId}`
              : (exerciseId as any),
          intervalIndex:
            intervalIndex === undefined
              ? sql`${intervalLog.intervalIndex}`
              : intervalIndex,
          targetValue:
            targetValue === undefined
              ? sql`${intervalLog.targetValue}`
              : (targetValue as any),
          actualValue:
            actualValue === undefined
              ? sql`${intervalLog.actualValue}`
              : (actualValue as any),
          durationS:
            durationS === undefined
              ? sql`${intervalLog.durationS}`
              : toDbNumeric(durationS),
          notes:
            notes === undefined ? sql`${intervalLog.notes}` : (notes as any),
        })
        .where(eq(intervalLog.id, intervalLogId))
        .returning();

      return mapIntervalRow(updated!);
    },

    async delete({ orgId, athleteId, sessionId, intervalLogId }) {
      const existing = await this.get({
        orgId,
        athleteId,
        sessionId,
        intervalLogId,
      });
      if (!existing) return;

      await database
        .delete(intervalLog)
        .where(eq(intervalLog.id, intervalLogId));
    },
  };
}

function mapIntervalRow(r: typeof IntervalTbl.$inferSelect): TIntervalRow {
  return {
    id: r.id,
    sessionId: r.sessionId,
    sessionBlockId: r.sessionBlockId ?? null,
    exerciseId: r.exerciseId ?? null,
    intervalIndex: r.intervalIndex,
    targetValue: r.targetValue ?? null,
    actualValue: r.actualValue ?? null,
    durationS: r.durationS === null ? null : Number(r.durationS as any),
    notes: r.notes ?? null,
  };
}

export const intervalsRepository = makeIntervalsRepository();
