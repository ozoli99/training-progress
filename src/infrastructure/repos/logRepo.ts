import { db } from "../db/client";
import { sessionLogs, sets } from "../db/schema";

export async function createLog(input: {
  log: { id: string; date: string; exerciseId: string; notes?: string };
  sets: {
    id: string;
    sessionLogId: string;
    reps?: number;
    weight?: number;
    timeSec?: number;
    rpe?: number;
  }[];
}) {
  await db.insert(sessionLogs).values(input.log);
  if (input.sets.length) {
    await db.insert(sets).values(input.sets);
  }
  return input.log.id;
}

export async function getLogsByExercise(exerciseId: string) {
  const logs = await db.query.sessionLogs.findMany({
    where: (l, { eq }) => eq(l.exerciseId, exerciseId),
    with: { sets: true },
    orderBy: (l, { desc }) => [desc(l.date)],
  });
  return logs;
}

export async function getLogsInRange(startISO: string, endISO: string) {
  const logs = await db.query.sessionLogs.findMany({
    where: (l, { gte, lte, and }) =>
      and(gte(l.date, startISO), lte(l.date, endISO)),
    with: { sets: true, exercise: true },
  });
  return logs;
}
