import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { setLog } from "@/infrastructure/db/schema";

export async function repoListSetsBySession(sessionId: string) {
  return db
    .select()
    .from(setLog)
    .where(eq(setLog.sessionId, sessionId))
    .orderBy(asc(setLog.setIndex));
}

export async function repoGetSet(id: string) {
  const [row] = await db
    .select()
    .from(setLog)
    .where(eq(setLog.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoNextSetIndex(sessionId: string) {
  const [agg] = await db
    .select({ mx: max(setLog.setIndex).as("mx") })
    .from(setLog)
    .where(eq(setLog.sessionId, sessionId));
  return (agg?.mx ?? 0) + 1;
}

export async function repoInsertSet(input: {
  sessionId: string;
  sessionBlockId?: string | null;
  exerciseId: string;
  setIndex?: number | null;
  reps?: number | null;
  loadKg?: string | null;
  durationS?: string | null;
  distanceM?: string | null;
  rpe?: string | null;
  toFailure?: boolean | null;
}) {
  const finalIndex =
    input.setIndex ?? (await repoNextSetIndex(input.sessionId));
  const [row] = await db
    .insert(setLog)
    .values({
      sessionId: input.sessionId,
      sessionBlockId: input.sessionBlockId ?? null,
      exerciseId: input.exerciseId,
      setIndex: finalIndex,
      reps: input.reps ?? null,
      loadKg: input.loadKg ?? null,
      durationS: input.durationS ?? null,
      distanceM: input.distanceM ?? null,
      rpe: input.rpe ?? null,
      toFailure: input.toFailure ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdateSet(
  id: string,
  patch: {
    sessionBlockId?: string | null;
    exerciseId?: string;
    setIndex?: number | null;
    reps?: number | null;
    loadKg?: string | null;
    durationS?: string | null;
    distanceM?: string | null;
    rpe?: string | null;
    toFailure?: boolean | null;
  }
) {
  const [row] = await db
    .update(setLog)
    .set({
      sessionBlockId: patch.sessionBlockId ?? undefined,
      exerciseId: patch.exerciseId ?? undefined,
      setIndex: patch.setIndex ?? undefined,
      reps: patch.reps ?? undefined,
      loadKg: patch.loadKg ?? undefined,
      durationS: patch.durationS ?? undefined,
      distanceM: patch.distanceM ?? undefined,
      rpe: patch.rpe ?? undefined,
      toFailure: patch.toFailure ?? undefined,
    })
    .where(eq(setLog.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteSet(id: string) {
  await db.delete(setLog).where(eq(setLog.id, id));
}
