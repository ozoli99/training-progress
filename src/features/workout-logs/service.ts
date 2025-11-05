import { repoGetSessionById } from "@/features/sessions/repository";
import {
  repoDeleteWorkoutLog,
  repoGetWorkoutLog,
  repoInsertWorkoutLog,
  repoListWorkoutLogsBySession,
  repoUpdateWorkoutLog,
  repoDeleteEntry,
  repoInsertEntry,
  repoListEntries,
  repoUpdateEntry,
  repoDeleteRound,
  repoInsertRound,
  repoListRounds,
  repoUpdateRound,
  repoGetEntryById,
  repoGetRoundById,
} from "./repository";

export async function listWorkoutLogsService(sessionId: string) {
  return repoListWorkoutLogsBySession(sessionId);
}

export async function createWorkoutLogService(
  ctx: { orgId: string; athleteId: string },
  sessionId: string,
  input: {
    sessionBlockId?: string | null;
    workoutId: string;
    plannedWorkoutId?: string | null;
    workoutVersionId?: string | null;
    resultRaw?: string | null;
    resultPrimary?: string | null;
    asRx?: boolean;
    isDraft?: boolean;
  }
) {
  const s = await repoGetSessionById(sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  return repoInsertWorkoutLog({ sessionId, ...input });
}

export async function updateWorkoutLogService(
  ctx: { orgId: string; athleteId: string },
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
  const current = await repoGetWorkoutLog(id);
  if (!current) throw new Error("Workout log not found");
  const s = await repoGetSessionById(current.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  const updated = await repoUpdateWorkoutLog(id, patch);
  if (!updated) throw new Error("Update failed");
  return updated;
}

export async function deleteWorkoutLogService(
  ctx: { orgId: string; athleteId: string },
  id: string
) {
  const current = await repoGetWorkoutLog(id);
  if (!current) throw new Error("Workout log not found");
  const s = await repoGetSessionById(current.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  await repoDeleteWorkoutLog(id);
}

// ---- Entries
export async function listEntriesService(workoutLogId: string) {
  return repoListEntries(workoutLogId);
}
export async function createEntryService(
  ctx: { orgId: string; athleteId: string },
  workoutLogId: string,
  input: {
    exerciseId: string;
    sequenceIndex?: number | null;
    reps?: number | null;
    loadKg?: string | null;
    scaled?: boolean | null;
    scaledToExerciseId?: string | null;
    actualPrescription?: any;
    equipmentExtra?: any;
  }
) {
  // auth via parent workoutLog → session
  const wl = await repoGetWorkoutLog(workoutLogId);
  if (!wl) throw new Error("Workout log not found");
  const s = await repoGetSessionById(wl.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  return repoInsertEntry({ workoutLogId, ...input });
}
export async function updateEntryService(
  ctx: { orgId: string; athleteId: string },
  entryId: string,
  patch: any
) {
  const entry = await repoGetEntryById(entryId);
  if (!entry) throw new Error("Entry not found");
  const wl = await repoGetWorkoutLog(entry.workoutLogId);
  if (!wl) throw new Error("Workout log not found");
  const s = await repoGetSessionById(wl.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  const updated = await repoUpdateEntry(entryId, patch);
  if (!updated) throw new Error("Update failed");
  return updated;
}
export async function deleteEntryService(
  ctx: { orgId: string; athleteId: string },
  entryId: string
) {
  const entry = await repoGetEntryById(entryId);
  if (!entry) throw new Error("Entry not found");
  const wl = await repoGetWorkoutLog(entry.workoutLogId);
  if (!wl) throw new Error("Workout log not found");
  const s = await repoGetSessionById(wl.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  await repoDeleteEntry(entryId);
}

// ---- Rounds
export async function listRoundsService(workoutLogId: string) {
  return repoListRounds(workoutLogId);
}
export async function createRoundService(
  ctx: { orgId: string; athleteId: string },
  workoutLogId: string,
  input: {
    roundIndex?: number | null;
    durationS?: string | null;
    repsTotal?: number | null;
    notes?: string | null;
  }
) {
  const wl = await repoGetWorkoutLog(workoutLogId);
  if (!wl) throw new Error("Workout log not found");
  const s = await repoGetSessionById(wl.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  return repoInsertRound({ workoutLogId, ...input });
}
export async function updateRoundService(
  ctx: { orgId: string; athleteId: string },
  roundId: string,
  patch: any
) {
  const round = await repoGetRoundById(roundId);
  if (!round) throw new Error("Round not found");
  const wl = await repoGetWorkoutLog(round.workoutLogId);
  if (!wl) throw new Error("Workout log not found");
  const s = await repoGetSessionById(wl.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  const updated = await repoUpdateRound(roundId, patch);
  if (!updated) throw new Error("Update failed");
  return updated;
}
export async function deleteRoundService(
  ctx: { orgId: string; athleteId: string },
  roundId: string
) {
  const round = await repoGetRoundById(roundId);
  if (!round) throw new Error("Round not found");
  const wl = await repoGetWorkoutLog(round.workoutLogId);
  if (!wl) throw new Error("Workout log not found");
  const s = await repoGetSessionById(wl.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  await repoDeleteRound(roundId);
}
