import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { session } from "@/infrastructure/db/schema";

type ListArgs = {
  orgId: string;
  athleteId: string;
  limit: number;
  offset: number;
  from?: string;
  to?: string;
  order: "asc" | "desc";
  status?: string;
  trainingLocationId?: string;
};

export async function repoListSessions(args: ListArgs) {
  const filters = [
    eq(session.orgId, args.orgId),
    eq(session.athleteId, args.athleteId),
    args.from ? gte(session.sessionDate, args.from) : undefined,
    args.to ? lte(session.sessionDate, args.to) : undefined,
    args.status ? eq(session.status, args.status) : undefined,
    args.trainingLocationId
      ? eq(session.trainingLocationId, args.trainingLocationId)
      : undefined,
  ].filter(Boolean) as any[];

  const rows = await db
    .select()
    .from(session)
    .where(and(...filters))
    .orderBy(
      args.order === "asc"
        ? asc(session.sessionDate)
        : desc(session.sessionDate)
    )
    .limit(args.limit)
    .offset(args.offset);

  return rows;
}

export async function repoGetSessionById(id: string) {
  const [row] = await db
    .select()
    .from(session)
    .where(eq(session.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoInsertSession(input: {
  orgId: string;
  athleteId: string;
  sessionDate: string;
  status?: string | null;
  completionPct?: number | null;
  loadSource?: string | null;
  trainingLocationId?: string | null;
  plannedSessionId?: string | null;
}) {
  const [row] = await db
    .insert(session)
    .values({
      orgId: input.orgId,
      athleteId: input.athleteId,
      sessionDate: input.sessionDate,
      status: input.status ?? null,
      completionPct: input.completionPct ?? 0,
      loadSource: input.loadSource ?? null,
      trainingLocationId: input.trainingLocationId ?? null,
      plannedSessionId: input.plannedSessionId ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdateSessionById(
  id: string,
  patch: {
    sessionDate?: string;
    status?: string | null;
    completionPct?: number | null;
    loadSource?: string | null;
    trainingLocationId?: string | null;
  }
) {
  const [row] = await db
    .update(session)
    .set({
      sessionDate: patch.sessionDate,
      status: patch.status,
      completionPct: patch.completionPct ?? undefined,
      loadSource: patch.loadSource,
      trainingLocationId: patch.trainingLocationId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(session.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteSessionById(id: string) {
  await db.delete(session).where(eq(session.id, id));
}

export async function repoFindByPlannedId(plannedSessionId: string) {
  const [row] = await db
    .select()
    .from(session)
    .where(eq(session.plannedSessionId, plannedSessionId))
    .limit(1);
  return row ?? null;
}
