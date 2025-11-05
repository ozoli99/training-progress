import { db } from "@/infrastructure/db/client";
import { intervalLog } from "@/infrastructure/db/schema";
import { and, asc, eq, max } from "drizzle-orm";

export async function repoListIntervalsBySession(sessionId: string) {
  return db
    .select()
    .from(intervalLog)
    .where(eq(intervalLog.sessionId, sessionId))
    .orderBy(asc(intervalLog.sessionBlockId), asc(intervalLog.intervalIndex));
}

export async function repoListIntervalsByWorkoutLogSessionBlock(
  sessionId: string,
  sessionBlockId?: string | null
) {
  if (sessionBlockId) {
    return db
      .select()
      .from(intervalLog)
      .where(
        and(
          eq(intervalLog.sessionId, sessionId),
          eq(intervalLog.sessionBlockId, sessionBlockId)
        )
      )
      .orderBy(asc(intervalLog.intervalIndex));
  }
  return repoListIntervalsBySession(sessionId);
}

export async function repoGetIntervalById(id: string) {
  const [row] = await db
    .select()
    .from(intervalLog)
    .where(eq(intervalLog.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoNextIntervalIndex(
  sessionBlockId: string | null,
  sessionId: string
) {
  const where = sessionBlockId
    ? and(
        eq(intervalLog.sessionId, sessionId),
        eq(intervalLog.sessionBlockId, sessionBlockId)
      )
    : eq(intervalLog.sessionId, sessionId);

  const [agg] = await db
    .select({ mx: max(intervalLog.intervalIndex).as("mx") })
    .from(intervalLog)
    .where(where);
  return (agg?.mx ?? 0) + 1;
}

export async function repoInsertInterval(input: {
  sessionId: string;
  sessionBlockId?: string | null;
  exerciseId?: string | null;
  intervalIndex?: number | null;
  targetValue?: any;
  actualValue?: any;
  durationS?: string | null;
  notes?: string | null;
}) {
  const idx =
    input.intervalIndex ??
    (await repoNextIntervalIndex(
      input.sessionBlockId ?? null,
      input.sessionId
    ));
  const [row] = await db
    .insert(intervalLog)
    .values({
      sessionId: input.sessionId,
      sessionBlockId: input.sessionBlockId ?? null,
      exerciseId: input.exerciseId ?? null,
      intervalIndex: idx,
      targetValue: input.targetValue ?? null,
      actualValue: input.actualValue ?? null,
      durationS: input.durationS ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdateInterval(
  id: string,
  patch: {
    sessionBlockId?: string | null;
    exerciseId?: string | null;
    intervalIndex?: number | null;
    targetValue?: any;
    actualValue?: any;
    durationS?: string | null;
    notes?: string | null;
  }
) {
  const [row] = await db
    .update(intervalLog)
    .set({
      sessionBlockId: patch.sessionBlockId ?? undefined,
      exerciseId: patch.exerciseId ?? undefined,
      intervalIndex: patch.intervalIndex ?? undefined,
      targetValue: patch.targetValue ?? undefined,
      actualValue: patch.actualValue ?? undefined,
      durationS: patch.durationS ?? undefined,
      notes: patch.notes ?? undefined,
    })
    .where(eq(intervalLog.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteInterval(id: string) {
  await db.delete(intervalLog).where(eq(intervalLog.id, id));
}
