import { repoGetSessionById } from "@/features/sessions/repository";
import {
  repoDeleteInterval,
  repoGetIntervalById,
  repoInsertInterval,
  repoListIntervalsByWorkoutLogSessionBlock,
  repoUpdateInterval,
} from "./repository";

// List by session (optionally filter a block)
export async function listIntervalsService(
  sessionId: string,
  sessionBlockId?: string | null
) {
  return repoListIntervalsByWorkoutLogSessionBlock(
    sessionId,
    sessionBlockId ?? null
  );
}

export async function createIntervalService(
  ctx: { orgId: string; athleteId: string },
  sessionId: string,
  input: {
    sessionBlockId?: string | null;
    exerciseId?: string | null;
    intervalIndex?: number | null;
    targetValue?: any;
    actualValue?: any;
    durationS?: string | null;
    notes?: string | null;
  }
) {
  const s = await repoGetSessionById(sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  return repoInsertInterval({ sessionId, ...input });
}

export async function updateIntervalService(
  ctx: { orgId: string; athleteId: string },
  intervalId: string,
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
  const current = await repoGetIntervalById(intervalId);
  if (!current) throw new Error("Interval not found");
  const s = await repoGetSessionById(current.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  const updated = await repoUpdateInterval(intervalId, patch);
  if (!updated) throw new Error("Update failed");
  return updated;
}

export async function deleteIntervalService(
  ctx: { orgId: string; athleteId: string },
  intervalId: string
) {
  const current = await repoGetIntervalById(intervalId);
  if (!current) throw new Error("Interval not found");
  const s = await repoGetSessionById(current.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  await repoDeleteInterval(intervalId);
}
