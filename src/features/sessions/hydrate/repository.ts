import { and, asc, eq } from "drizzle-orm";
import {
  session,
  sessionBlock,
  setLog,
  workoutLog,
} from "@/infrastructure/db/schema";
import { db } from "@/infrastructure/db/client";

export async function repoGetSessionFull(sessionId: string) {
  const [row] = await db
    .select()
    .from(session)
    .where(eq(session.id, sessionId))
    .limit(1);
  return row ?? null;
}

export async function repoListBlocks(sessionId: string) {
  return db
    .select()
    .from(sessionBlock)
    .where(eq(sessionBlock.sessionId, sessionId))
    .orderBy(asc(sessionBlock.blockIndex));
}

export async function repoListSetsForSession(sessionId: string) {
  return db
    .select()
    .from(setLog)
    .where(eq(setLog.sessionId, sessionId))
    .orderBy(asc(setLog.setIndex));
}

export async function repoListSetsForBlock(sessionId: string, blockId: string) {
  return db
    .select()
    .from(setLog)
    .where(
      and(eq(setLog.sessionId, sessionId), eq(setLog.sessionBlockId, blockId))
    )
    .orderBy(asc(setLog.setIndex));
}

export async function repoListWorkoutLogs(sessionId: string) {
  return db
    .select()
    .from(workoutLog)
    .where(eq(workoutLog.sessionId, sessionId))
    .orderBy(asc(workoutLog.id)); // stable
}
