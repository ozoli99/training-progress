import { repoGetSessionById } from "@/features/sessions/repository";
import {
  repoDeleteSet,
  repoGetSet,
  repoInsertSet,
  repoListSetsBySession,
  repoUpdateSet,
} from "./repository";

export async function listSetsService(sessionId: string) {
  return repoListSetsBySession(sessionId);
}

export async function createSetService(
  ctx: { orgId: string; athleteId: string },
  sessionId: string,
  input: {
    sessionBlockId?: string | null;
    exerciseId: string;
    setIndex?: number | null;
    reps?: number | null;
    loadKg?: string | null;
    durationS?: string | null;
    distanceM?: string | null;
    rpe?: string | null;
    toFailure?: boolean | null;
  }
) {
  const s = await repoGetSessionById(sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  return repoInsertSet({ sessionId, ...input });
}

export async function updateSetService(
  ctx: { orgId: string; athleteId: string },
  setId: string,
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
  const current = await repoGetSet(setId);
  if (!current) throw new Error("Set not found");
  const s = await repoGetSessionById(current.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  const updated = await repoUpdateSet(setId, patch);
  if (!updated) throw new Error("Update failed");
  return updated;
}

export async function deleteSetService(
  ctx: { orgId: string; athleteId: string },
  setId: string
) {
  const current = await repoGetSet(setId);
  if (!current) throw new Error("Set not found");
  const s = await repoGetSessionById(current.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  await repoDeleteSet(setId);
}
