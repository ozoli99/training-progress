import { and, asc, desc, eq, sql } from "drizzle-orm";
import * as schema from "@/infrastructure/db/schema";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import type {
  TWorkoutLogRow,
  TWorkoutLogEntryRow,
  TWorkoutRoundRow,
} from "./dto";

const {
  session,
  workoutLog,
  workoutLogEntry,
  workoutRoundLog,
  workoutRoundEntryLog,
} = schema;

export interface WorkoutLogsRepository {
  ensureSessionInOrg(orgId: string, sessionId: string): Promise<boolean>;
  ensureLogInOrg(orgId: string, workoutLogId: string): Promise<boolean>;

  listLogs(input: {
    orgId: string;
    sessionId: string;
    limit?: number;
    offset?: number;
    order?: "asc" | "desc";
  }): Promise<TWorkoutLogRow[]>;

  getLog(input: {
    orgId: string;
    sessionId: string;
    workoutLogId: string;
  }): Promise<TWorkoutLogRow | null>;

  createLog(input: {
    orgId: string;
    sessionId: string;
    sessionBlockId?: string;
    workoutId: string;
    plannedWorkoutId?: string;
    workoutVersionId?: string;
    resultRaw?: string;
    resultPrimary?: number;
    asRx?: boolean;
    isDraft?: boolean;
  }): Promise<TWorkoutLogRow>;

  updateLog(input: {
    orgId: string;
    sessionId: string;
    workoutLogId: string;
    patch: Partial<typeof workoutLog.$inferInsert>;
  }): Promise<TWorkoutLogRow | null>;

  deleteLog(input: {
    orgId: string;
    sessionId: string;
    workoutLogId: string;
  }): Promise<number>;

  listEntries(input: {
    orgId: string;
    workoutLogId: string;
    order?: "asc" | "desc";
  }): Promise<TWorkoutLogEntryRow[]>;

  replaceEntries(input: {
    orgId: string;
    workoutLogId: string;
    items: Array<{
      exerciseId: string;
      sequenceIndex: number;
      reps?: number | null;
      loadKg?: number | null;
      scaled?: boolean;
      scaledToExerciseId?: string | null;
      actualPrescription?: unknown;
      equipmentExtra?: unknown;
    }>;
  }): Promise<TWorkoutLogEntryRow[]>;

  listRounds(input: {
    orgId: string;
    workoutLogId: string;
    order?: "asc" | "desc";
  }): Promise<TWorkoutRoundRow[]>;

  replaceRounds(input: {
    orgId: string;
    workoutLogId: string;
    items: Array<{
      roundIndex: number;
      durationS?: number | null;
      repsTotal?: number | null;
      notes?: string | null;
      entries?: Array<{
        exerciseId: string;
        reps?: number | null;
        loadKg?: number | null;
        extra?: unknown;
      }>;
    }>;
  }): Promise<{
    rounds: TWorkoutRoundRow[];
  }>;
}

export function makeWorkoutLogsRepository(
  database = defaultDatabase
): WorkoutLogsRepository {
  return {
    async ensureSessionInOrg(orgId, sessionId) {
      const [s] = await database
        .select({ id: session.id })
        .from(session)
        .where(and(eq(session.id, sessionId), eq(session.orgId, orgId)))
        .limit(1);
      return !!s;
    },

    async ensureLogInOrg(orgId, workoutLogId) {
      const [row] = await database
        .select({ id: workoutLog.id })
        .from(workoutLog)
        .innerJoin(session, eq(workoutLog.sessionId, session.id))
        .where(and(eq(workoutLog.id, workoutLogId), eq(session.orgId, orgId)))
        .limit(1);
      return !!row;
    },

    async listLogs({
      orgId,
      sessionId,
      limit = 50,
      offset = 0,
      order = "asc",
    }) {
      const ok = await this.ensureSessionInOrg(orgId, sessionId);
      if (!ok) return [];

      const orderBy =
        order === "asc" ? asc(workoutLog.id) : desc(workoutLog.id);

      const rows = await database
        .select()
        .from(workoutLog)
        .where(eq(workoutLog.sessionId, sessionId))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return rows.map(mapWorkoutLogRow);
    },

    async getLog({ orgId, sessionId, workoutLogId }) {
      const ok = await this.ensureSessionInOrg(orgId, sessionId);
      if (!ok) return null;

      const [row] = await database
        .select()
        .from(workoutLog)
        .where(
          and(
            eq(workoutLog.id, workoutLogId),
            eq(workoutLog.sessionId, sessionId)
          )
        )
        .limit(1);

      return row ? mapWorkoutLogRow(row) : null;
    },

    async createLog({
      orgId,
      sessionId,
      sessionBlockId,
      workoutId,
      plannedWorkoutId,
      workoutVersionId,
      resultRaw,
      resultPrimary,
      asRx,
      isDraft,
    }) {
      const ok = await this.ensureSessionInOrg(orgId, sessionId);
      if (!ok) return Promise.reject(new Error("Session not in org."));

      const [row] = await database
        .insert(workoutLog)
        .values({
          sessionId,
          sessionBlockId: sessionBlockId ?? null,
          workoutId,
          plannedWorkoutId: plannedWorkoutId ?? null,
          workoutVersionId: workoutVersionId ?? null,
          resultRaw: resultRaw ?? null,
          resultPrimary: resultPrimary != null ? String(resultPrimary) : null,
          asRx: asRx ?? false,
          isDraft: isDraft ?? false,
        })
        .returning();

      return mapWorkoutLogRow(row);
    },

    async updateLog({ orgId, sessionId, workoutLogId, patch }) {
      const ok = await this.ensureSessionInOrg(orgId, sessionId);
      if (!ok) return null;

      const [row] = await database
        .update(workoutLog)
        .set(patch)
        .where(
          and(
            eq(workoutLog.id, workoutLogId),
            eq(workoutLog.sessionId, sessionId)
          )
        )
        .returning();

      return row ? mapWorkoutLogRow(row) : null;
    },

    async deleteLog({ orgId, sessionId, workoutLogId }) {
      const ok = await this.ensureSessionInOrg(orgId, sessionId);
      if (!ok) return 0;

      const roundIds = await database
        .select({ id: workoutRoundLog.id })
        .from(workoutRoundLog)
        .where(eq(workoutRoundLog.workoutLogId, workoutLogId));

      if (roundIds.length) {
        await database
          .delete(workoutRoundEntryLog)
          .where(
            eq(
              workoutRoundEntryLog.workoutRoundLogId,
              sql`${workoutRoundLog.id}`
            )
          );
      }
      await database.execute(sql`
        delete from ${workoutRoundEntryLog}
        where ${workoutRoundEntryLog.workoutRoundLogId} in (
          select ${workoutRoundLog.id}
          from ${workoutRoundLog}
          where ${workoutRoundLog.workoutLogId} = ${workoutLogId}
        )
      `);

      await database
        .delete(workoutRoundLog)
        .where(eq(workoutRoundLog.workoutLogId, workoutLogId));

      await database
        .delete(workoutLogEntry)
        .where(eq(workoutLogEntry.workoutLogId, workoutLogId));

      const res = await database
        .delete(workoutLog)
        .where(
          and(
            eq(workoutLog.id, workoutLogId),
            eq(workoutLog.sessionId, sessionId)
          )
        );

      return res.rowCount ?? 0;
    },

    async listEntries({ orgId, workoutLogId, order = "asc" }) {
      const ok = await this.ensureLogInOrg(orgId, workoutLogId);
      if (!ok) return [];

      const orderBy =
        order === "asc"
          ? asc(workoutLogEntry.sequenceIndex)
          : desc(workoutLogEntry.sequenceIndex);

      const rows = await database
        .select()
        .from(workoutLogEntry)
        .where(eq(workoutLogEntry.workoutLogId, workoutLogId))
        .orderBy(orderBy);

      return rows.map(mapWorkoutLogEntryRow);
    },

    async replaceEntries({ orgId, workoutLogId, items }) {
      const ok = await this.ensureLogInOrg(orgId, workoutLogId);
      if (!ok) return Promise.reject(new Error("WorkoutLog not in org."));

      await database
        .delete(workoutLogEntry)
        .where(eq(workoutLogEntry.workoutLogId, workoutLogId));

      if (items.length === 0) return [];

      const payload: (typeof workoutLogEntry.$inferInsert)[] = items.map(
        (it) => ({
          workoutLogId,
          exerciseId: it.exerciseId,
          sequenceIndex: it.sequenceIndex ?? 0,
          reps: it.reps ?? null,
          loadKg: it.loadKg != null ? String(it.loadKg) : null,
          scaled: it.scaled ?? false,
          scaledToExerciseId: it.scaledToExerciseId ?? null,
          actualPrescription: it.actualPrescription ?? null,
          equipmentExtra: it.equipmentExtra ?? null,
        })
      );

      const rows = await database
        .insert(workoutLogEntry)
        .values(payload)
        .returning();

      return rows.map(mapWorkoutLogEntryRow);
    },

    async listRounds({ orgId, workoutLogId, order = "asc" }) {
      const ok = await this.ensureLogInOrg(orgId, workoutLogId);
      if (!ok) return [];

      const orderBy =
        order === "asc"
          ? asc(workoutRoundLog.roundIndex)
          : desc(workoutRoundLog.roundIndex);

      const rows = await database
        .select()
        .from(workoutRoundLog)
        .where(eq(workoutRoundLog.workoutLogId, workoutLogId))
        .orderBy(orderBy);

      return rows.map(mapWorkoutRoundRow);
    },

    async replaceRounds({ orgId, workoutLogId, items }) {
      const ok = await this.ensureLogInOrg(orgId, workoutLogId);
      if (!ok) return Promise.reject(new Error("WorkoutLog not in org."));

      await database.execute(sql`
        delete from ${workoutRoundEntryLog}
        where ${workoutRoundEntryLog.workoutRoundLogId} in (
          select ${workoutRoundLog.id}
          from ${workoutRoundLog}
          where ${workoutRoundLog.workoutLogId} = ${workoutLogId}
        )
      `);
      await database
        .delete(workoutRoundLog)
        .where(eq(workoutRoundLog.workoutLogId, workoutLogId));

      if (items.length === 0) return { rounds: [] };

      const roundPayload: (typeof workoutRoundLog.$inferInsert)[] = items.map(
        (it) => ({
          workoutLogId,
          roundIndex: it.roundIndex ?? 0,
          durationS: it.durationS != null ? String(it.durationS) : null,
          repsTotal: it.repsTotal ?? null,
          notes: it.notes ?? null,
        })
      );

      const insertedRounds = await database
        .insert(workoutRoundLog)
        .values(roundPayload)
        .returning();

      const entryPayload: (typeof workoutRoundEntryLog.$inferInsert)[] = [];
      for (let i = 0; i < items.length; i++) {
        const src = items[i];
        const roundRow = insertedRounds[i];
        if (!src.entries?.length) continue;

        for (const e of src.entries) {
          entryPayload.push({
            workoutRoundLogId: roundRow.id,
            exerciseId: e.exerciseId,
            reps: e.reps ?? null,
            loadKg: e.loadKg != null ? String(e.loadKg) : null,
            extra: e.extra ?? null,
          });
        }
      }
      if (entryPayload.length) {
        await database.insert(workoutRoundEntryLog).values(entryPayload);
      }

      return { rounds: insertedRounds.map(mapWorkoutRoundRow) };
    },
  };
}

function mapWorkoutLogRow(r: typeof workoutLog.$inferSelect): TWorkoutLogRow {
  return {
    id: r.id,
    sessionId: r.sessionId,
    sessionBlockId: r.sessionBlockId ?? null,
    workoutId: r.workoutId,
    plannedWorkoutId: r.plannedWorkoutId ?? null,
    workoutVersionId: r.workoutVersionId ?? null,
    resultRaw: r.resultRaw ?? null,
    resultPrimary: r.resultPrimary != null ? Number(r.resultPrimary) : null,
    asRx: !!r.asRx,
    isDraft: !!r.isDraft,
  };
}

function mapWorkoutLogEntryRow(
  r: typeof workoutLogEntry.$inferSelect
): TWorkoutLogEntryRow {
  return {
    id: r.id,
    workoutLogId: r.workoutLogId,
    exerciseId: r.exerciseId,
    sequenceIndex: r.sequenceIndex,
    reps: r.reps ?? null,
    loadKg: r.loadKg != null ? Number(r.loadKg) : null,
    scaled: !!r.scaled,
    scaledToExerciseId: r.scaledToExerciseId ?? null,
    actualPrescription: r.actualPrescription ?? null,
    equipmentExtra: r.equipmentExtra ?? null,
  };
}

function mapWorkoutRoundRow(
  r: typeof workoutRoundLog.$inferSelect
): TWorkoutRoundRow {
  return {
    id: r.id,
    workoutLogId: r.workoutLogId,
    roundIndex: r.roundIndex,
    durationS: r.durationS != null ? Number(r.durationS) : null,
    repsTotal: r.repsTotal ?? null,
    notes: r.notes ?? null,
  };
}
