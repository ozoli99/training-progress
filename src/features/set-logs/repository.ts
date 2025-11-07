import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import * as schema from "@/infrastructure/db/schema";
import type { ListQuery, TSetLogRow } from "./dto";

const { setLog, session, sessionBlock, exercise } = schema;

export type SetLogInsert = typeof setLog.$inferInsert;

export interface SetLogsRepository {
  ensureSessionScope(
    orgId: string,
    athleteId: string,
    sessionId: string
  ): Promise<boolean>;
  ensureBlockBelongsToSession(
    sessionId: string,
    sessionBlockId: string
  ): Promise<boolean>;
  ensureExerciseInOrg(orgId: string, exerciseId: string): Promise<boolean>;

  list(input: { sessionId: string } & ListQuery): Promise<TSetLogRow[]>;
  get(sessionId: string, setLogId: string): Promise<TSetLogRow | undefined>;
  create(values: typeof setLog.$inferInsert): Promise<TSetLogRow>;
  update(
    sessionId: string,
    setLogId: string,
    patch: Partial<typeof setLog.$inferInsert>
  ): Promise<TSetLogRow | undefined>;
  remove(sessionId: string, setLogId: string): Promise<number>;
}

export function makeSetLogsRepository(
  database = defaultDatabase
): SetLogsRepository {
  return {
    async ensureSessionScope(orgId, athleteId, sessionId) {
      const [s] = await database
        .select({ id: session.id })
        .from(session)
        .where(
          and(
            eq(session.id, sessionId),
            eq(session.orgId, orgId),
            eq(session.athleteId, athleteId)
          )
        )
        .limit(1);
      return !!s;
    },

    async ensureBlockBelongsToSession(sessionId, sessionBlockId) {
      const [b] = await database
        .select({ id: sessionBlock.id })
        .from(sessionBlock)
        .where(
          and(
            eq(sessionBlock.id, sessionBlockId),
            eq(sessionBlock.sessionId, sessionId)
          )
        )
        .limit(1);
      return !!b;
    },

    async ensureExerciseInOrg(orgId, exerciseId) {
      const [e] = await database
        .select({ id: exercise.id })
        .from(exercise)
        .where(and(eq(exercise.id, exerciseId), eq(exercise.orgId, orgId)))
        .limit(1);
      return !!e;
    },

    async list({
      sessionId,
      limit = 50,
      offset = 0,
      sessionBlockId,
      exerciseId,
      plannedSetId,
      minIndex,
      maxIndex,
      order = "asc",
    }) {
      const where = and(
        eq(setLog.sessionId, sessionId),
        sessionBlockId ? eq(setLog.sessionBlockId, sessionBlockId) : undefined,
        exerciseId ? eq(setLog.exerciseId, exerciseId) : undefined,
        plannedSetId ? eq(setLog.plannedSetId, plannedSetId) : undefined,
        typeof minIndex === "number"
          ? gte(setLog.setIndex, minIndex)
          : undefined,
        typeof maxIndex === "number"
          ? lte(setLog.setIndex, maxIndex)
          : undefined
      );

      const orderBy =
        order === "asc" ? asc(setLog.setIndex) : desc(setLog.setIndex);

      const rows = await database
        .select()
        .from(setLog)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);
      return rows.map(mapRow);
    },

    async get(sessionId, setLogId) {
      const [row] = await database
        .select()
        .from(setLog)
        .where(and(eq(setLog.id, setLogId), eq(setLog.sessionId, sessionId)))
        .limit(1);
      return row ? mapRow(row) : undefined;
    },

    async create(values) {
      const [row] = await database.insert(setLog).values(values).returning();
      return mapRow(row);
    },

    async update(sessionId, setLogId, patch) {
      const [row] = await database
        .update(setLog)
        .set(patch)
        .where(and(eq(setLog.id, setLogId), eq(setLog.sessionId, sessionId)))
        .returning();
      return row ? mapRow(row) : undefined;
    },

    async remove(sessionId, setLogId) {
      const res = await database
        .delete(setLog)
        .where(and(eq(setLog.id, setLogId), eq(setLog.sessionId, sessionId)));
      return res.rowCount ?? 0;
    },
  };
}

function mapRow(r: typeof setLog.$inferSelect): TSetLogRow {
  return {
    id: r.id,
    sessionId: r.sessionId,
    sessionBlockId: r.sessionBlockId ?? null,
    exerciseId: r.exerciseId,
    plannedSetId: r.plannedSetId ?? null,
    setIndex: r.setIndex ?? 0,
    reps: r.reps ?? null,
    loadKg: (r.loadKg as string | null) ?? null,
    durationS: (r.durationS as string | null) ?? null,
    distanceM: (r.distanceM as string | null) ?? null,
    rpe: (r.rpe as string | null) ?? null,
    toFailure: r.toFailure ?? null,
  };
}

export const setLogsRepository = makeSetLogsRepository();
