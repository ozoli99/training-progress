import {
  repoGetPlannedSessionById,
  repoInsertPlannedSession,
  repoListPlannedSessions,
  repoUpdatePlannedSessionById,
  repoDeletePlannedSessionById,
} from "./repository";
import { repoAthleteExists } from "@/features/athlete-programs/repository"; // already implemented in your AP repo

export async function listPlannedSessionsService(args: {
  orgId: string;
  athleteId: string;
  limit: number;
  offset: number;
  from?: string;
  to?: string;
  order: "asc" | "desc";
  title?: string;
}) {
  return repoListPlannedSessions(args);
}

export async function createPlannedSessionService(params: {
  orgId: string;
  athleteId: string;
  plannedDate: string; // YYYY-MM-DD
  title?: string;
  notes?: string;
}) {
  const exists = await repoAthleteExists(params.orgId, params.athleteId);
  if (!exists) throw new Error("Athlete not found in org");

  return repoInsertPlannedSession({
    orgId: params.orgId,
    athleteId: params.athleteId,
    plannedDate: params.plannedDate,
    title: params.title,
    notes: params.notes,
  });
}

export async function getPlannedSessionService(id: string) {
  const row = await repoGetPlannedSessionById(id);
  if (!row) throw new Error("Planned session not found");
  return row;
}

export async function updatePlannedSessionService(
  id: string,
  context: { orgId: string; athleteId: string },
  patch: { plannedDate?: string; title?: string; notes?: string }
) {
  const current = await repoGetPlannedSessionById(id);
  if (!current) throw new Error("Planned session not found");
  if (
    current.orgId !== context.orgId ||
    current.athleteId !== context.athleteId
  ) {
    throw new Error("Forbidden");
  }
  const row = await repoUpdatePlannedSessionById(id, {
    plannedDate: patch.plannedDate,
    title: patch.title ?? null,
    notes: patch.notes ?? null,
  });
  if (!row) throw new Error("Update failed");
  return row;
}

export async function deletePlannedSessionService(
  id: string,
  context: { orgId: string; athleteId: string }
) {
  const current = await repoGetPlannedSessionById(id);
  if (!current) throw new Error("Planned session not found");
  if (
    current.orgId !== context.orgId ||
    current.athleteId !== context.athleteId
  ) {
    throw new Error("Forbidden");
  }
  await repoDeletePlannedSessionById(id);
}
