import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  workoutLog,
  workoutLogEntry,
  workoutRoundLog,
} from "@/infrastructure/db/schema";

// ---- WorkoutLog
export async function repoListWorkoutLogsBySession(sessionId: string) {
  return db
    .select()
    .from(workoutLog)
    .where(eq(workoutLog.sessionId, sessionId));
}

export async function repoGetWorkoutLog(id: string) {
  const [row] = await db
    .select()
    .from(workoutLog)
    .where(eq(workoutLog.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoInsertWorkoutLog(input: {
  sessionId: string;
  sessionBlockId?: string | null;
  workoutId: string;
  plannedWorkoutId?: string | null;
  workoutVersionId?: string | null;
  resultRaw?: string | null;
  resultPrimary?: string | null;
  asRx?: boolean;
  isDraft?: boolean;
}) {
  const [row] = await db
    .insert(workoutLog)
    .values({
      sessionId: input.sessionId,
      sessionBlockId: input.sessionBlockId ?? null,
      workoutId: input.workoutId,
      plannedWorkoutId: input.plannedWorkoutId ?? null,
      workoutVersionId: input.workoutVersionId ?? null,
      resultRaw: input.resultRaw ?? null,
      resultPrimary: input.resultPrimary ?? null,
      asRx: input.asRx ?? false,
      isDraft: input.isDraft ?? false,
    })
    .returning();
  return row!;
}

export async function repoUpdateWorkoutLog(
  id: string,
  patch: {
    sessionBlockId?: string | null;
    workoutId?: string;
    plannedWorkoutId?: string | null;
    workoutVersionId?: string | null;
    resultRaw?: string | null;
    resultPrimary?: string | null;
    asRx?: boolean;
    isDraft?: boolean;
  }
) {
  const [row] = await db
    .update(workoutLog)
    .set({
      sessionBlockId: patch.sessionBlockId ?? undefined,
      workoutId: patch.workoutId ?? undefined,
      plannedWorkoutId: patch.plannedWorkoutId ?? undefined,
      workoutVersionId: patch.workoutVersionId ?? undefined,
      resultRaw: patch.resultRaw ?? undefined,
      resultPrimary: patch.resultPrimary ?? undefined,
      asRx: patch.asRx ?? undefined,
      isDraft: patch.isDraft ?? undefined,
    })
    .where(eq(workoutLog.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteWorkoutLog(id: string) {
  await db.delete(workoutLog).where(eq(workoutLog.id, id));
}

// ---- Entries
export async function repoNextEntrySeq(workoutLogId: string) {
  const [agg] = await db
    .select({ mx: max(workoutLogEntry.sequenceIndex).as("mx") })
    .from(workoutLogEntry)
    .where(eq(workoutLogEntry.workoutLogId, workoutLogId));
  return (agg?.mx ?? 0) + 1;
}

export async function repoInsertEntry(input: {
  workoutLogId: string;
  exerciseId: string;
  sequenceIndex?: number | null;
  reps?: number | null;
  loadKg?: string | null;
  scaled?: boolean | null;
  scaledToExerciseId?: string | null;
  actualPrescription?: any;
  equipmentExtra?: any;
}) {
  const finalSeq =
    input.sequenceIndex ?? (await repoNextEntrySeq(input.workoutLogId));
  const [row] = await db
    .insert(workoutLogEntry)
    .values({
      workoutLogId: input.workoutLogId,
      exerciseId: input.exerciseId,
      sequenceIndex: finalSeq,
      reps: input.reps ?? null,
      loadKg: input.loadKg ?? null,
      scaled: input.scaled ?? false,
      scaledToExerciseId: input.scaledToExerciseId ?? null,
      actualPrescription: input.actualPrescription ?? null,
      equipmentExtra: input.equipmentExtra ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdateEntry(
  id: string,
  patch: {
    exerciseId?: string;
    sequenceIndex?: number | null;
    reps?: number | null;
    loadKg?: string | null;
    scaled?: boolean | null;
    scaledToExerciseId?: string | null;
    actualPrescription?: any;
    equipmentExtra?: any;
  }
) {
  const [row] = await db
    .update(workoutLogEntry)
    .set({
      exerciseId: patch.exerciseId ?? undefined,
      sequenceIndex: patch.sequenceIndex ?? undefined,
      reps: patch.reps ?? undefined,
      loadKg: patch.loadKg ?? undefined,
      scaled: patch.scaled ?? undefined,
      scaledToExerciseId: patch.scaledToExerciseId ?? undefined,
      actualPrescription: patch.actualPrescription ?? undefined,
      equipmentExtra: patch.equipmentExtra ?? undefined,
    })
    .where(eq(workoutLogEntry.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteEntry(id: string) {
  await db.delete(workoutLogEntry).where(eq(workoutLogEntry.id, id));
}

export async function repoListEntries(workoutLogId: string) {
  return db
    .select()
    .from(workoutLogEntry)
    .where(eq(workoutLogEntry.workoutLogId, workoutLogId))
    .orderBy(asc(workoutLogEntry.sequenceIndex));
}

// ---- Rounds
export async function repoNextRoundIndex(workoutLogId: string) {
  const [agg] = await db
    .select({ mx: max(workoutRoundLog.roundIndex).as("mx") })
    .from(workoutRoundLog)
    .where(eq(workoutRoundLog.workoutLogId, workoutLogId));
  return (agg?.mx ?? 0) + 1;
}

export async function repoInsertRound(input: {
  workoutLogId: string;
  roundIndex?: number | null;
  durationS?: string | null;
  repsTotal?: number | null;
  notes?: string | null;
}) {
  const finalIdx =
    input.roundIndex ?? (await repoNextRoundIndex(input.workoutLogId));
  const [row] = await db
    .insert(workoutRoundLog)
    .values({
      workoutLogId: input.workoutLogId,
      roundIndex: finalIdx,
      durationS: input.durationS ?? null,
      repsTotal: input.repsTotal ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdateRound(
  id: string,
  patch: {
    roundIndex?: number | null;
    durationS?: string | null;
    repsTotal?: number | null;
    notes?: string | null;
  }
) {
  const [row] = await db
    .update(workoutRoundLog)
    .set({
      roundIndex: patch.roundIndex ?? undefined,
      durationS: patch.durationS ?? undefined,
      repsTotal: patch.repsTotal ?? undefined,
      notes: patch.notes ?? undefined,
    })
    .where(eq(workoutRoundLog.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteRound(id: string) {
  await db.delete(workoutRoundLog).where(eq(workoutRoundLog.id, id));
}

export async function repoListRounds(workoutLogId: string) {
  return db
    .select()
    .from(workoutRoundLog)
    .where(eq(workoutRoundLog.workoutLogId, workoutLogId))
    .orderBy(asc(workoutRoundLog.roundIndex));
}

export async function repoGetEntryById(id: string) {
  const [row] = await db
    .select()
    .from(workoutLogEntry)
    .where(eq(workoutLogEntry.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoGetRoundById(id: string) {
  const [row] = await db
    .select()
    .from(workoutRoundLog)
    .where(eq(workoutRoundLog.id, id))
    .limit(1);
  return row ?? null;
}
