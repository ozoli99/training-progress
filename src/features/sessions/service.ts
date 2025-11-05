import {
  repoDeleteSessionById,
  repoFindByPlannedId,
  repoGetSessionById,
  repoInsertSession,
  repoListSessions,
  repoUpdateSessionById,
} from "./repository";
import { repoAthleteExists } from "@/features/athlete-programs/repository";
import { plannedSession } from "@/infrastructure/db/schema";
import { db } from "@/infrastructure/db/client";
import { eq } from "drizzle-orm";

export async function listSessionsService(args: {
  orgId: string;
  athleteId: string;
  limit: number;
  offset: number;
  from?: string;
  to?: string;
  order: "asc" | "desc";
  status?: string;
  trainingLocationId?: string;
}) {
  return repoListSessions(args);
}

export async function createSessionService(params: {
  orgId: string;
  athleteId: string;
  sessionDate: string;
  status?: string;
  completionPct?: number;
  loadSource?: string;
  trainingLocationId?: string;
  plannedSessionId?: string;
}) {
  const exists = await repoAthleteExists(params.orgId, params.athleteId);
  if (!exists) throw new Error("Athlete not found in org");

  if (params.plannedSessionId) {
    // Validate planned session belongs to same org/athlete and not already materialized
    const [ps] = await db
      .select()
      .from(plannedSession)
      .where(eq(plannedSession.id, params.plannedSessionId))
      .limit(1);

    if (!ps) throw new Error("Planned session not found");
    if (ps.orgId !== params.orgId || ps.athleteId !== params.athleteId) {
      throw new Error("Forbidden");
    }
    const existing = await repoFindByPlannedId(params.plannedSessionId);
    if (existing) throw new Error("Already materialized");
  }

  return repoInsertSession({
    orgId: params.orgId,
    athleteId: params.athleteId,
    sessionDate: params.sessionDate,
    status: params.status ?? "planned",
    completionPct: params.completionPct ?? 0,
    loadSource: params.loadSource ?? null,
    trainingLocationId: params.trainingLocationId ?? null,
    plannedSessionId: params.plannedSessionId ?? null,
  });
}

export async function getSessionService(id: string) {
  const row = await repoGetSessionById(id);
  if (!row) throw new Error("Session not found");
  return row;
}

export async function updateSessionService(
  id: string,
  context: { orgId: string; athleteId: string },
  patch: {
    sessionDate?: string;
    status?: string;
    completionPct?: number;
    loadSource?: string;
    trainingLocationId?: string;
  }
) {
  const current = await repoGetSessionById(id);
  if (!current) throw new Error("Session not found");
  if (
    current.orgId !== context.orgId ||
    current.athleteId !== context.athleteId
  ) {
    throw new Error("Forbidden");
  }
  const row = await repoUpdateSessionById(id, {
    sessionDate: patch.sessionDate,
    status: patch.status ?? null,
    completionPct: patch.completionPct ?? null,
    loadSource: patch.loadSource ?? null,
    trainingLocationId: patch.trainingLocationId ?? null,
  });
  if (!row) throw new Error("Update failed");
  return row;
}

export async function deleteSessionService(
  id: string,
  context: { orgId: string; athleteId: string }
) {
  const current = await repoGetSessionById(id);
  if (!current) throw new Error("Session not found");
  if (
    current.orgId !== context.orgId ||
    current.athleteId !== context.athleteId
  ) {
    throw new Error("Forbidden");
  }
  await repoDeleteSessionById(id);
}

/** Materialize a planned session into a real session (simple version). */
export async function materializePlannedSessionService(params: {
  orgId: string;
  athleteId: string;
  plannedSessionId: string;
}) {
  const [ps] = await db
    .select()
    .from(plannedSession)
    .where(eq(plannedSession.id, params.plannedSessionId))
    .limit(1);

  if (!ps) throw new Error("Planned session not found");
  if (ps.orgId !== params.orgId || ps.athleteId !== params.athleteId) {
    throw new Error("Forbidden");
  }

  const existing = await repoFindByPlannedId(params.plannedSessionId);
  if (existing) return existing; // idempotent

  return repoInsertSession({
    orgId: ps.orgId,
    athleteId: ps.athleteId,
    sessionDate: ps.plannedDate, // same day
    status: "planned",
    completionPct: 0,
    loadSource: "planned",
    trainingLocationId: null,
    plannedSessionId: ps.id,
  });
}
