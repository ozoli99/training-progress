import { and, asc, desc, eq, gte, lte, ilike } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { plannedSession } from "@/infrastructure/db/schema";

type ListArgs = {
  orgId: string;
  athleteId: string;
  limit: number;
  offset: number;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  order: "asc" | "desc";
  title?: string;
};

export async function repoListPlannedSessions(args: ListArgs) {
  const filters = [
    eq(plannedSession.orgId, args.orgId),
    eq(plannedSession.athleteId, args.athleteId),
    args.from ? gte(plannedSession.plannedDate, args.from) : undefined,
    args.to ? lte(plannedSession.plannedDate, args.to) : undefined,
    args.title ? ilike(plannedSession.title, `%${args.title}%`) : undefined,
  ].filter(Boolean) as any[];

  const rows = await db
    .select()
    .from(plannedSession)
    .where(and(...filters))
    .orderBy(
      args.order === "asc"
        ? asc(plannedSession.plannedDate)
        : desc(plannedSession.plannedDate)
    )
    .limit(args.limit)
    .offset(args.offset);

  return rows;
}

export async function repoGetPlannedSessionById(id: string) {
  const [row] = await db
    .select()
    .from(plannedSession)
    .where(eq(plannedSession.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoInsertPlannedSession(input: {
  orgId: string;
  athleteId: string;
  plannedDate: string; // date() needs string
  title?: string | null;
  notes?: string | null;
}) {
  const [row] = await db
    .insert(plannedSession)
    .values({
      orgId: input.orgId,
      athleteId: input.athleteId,
      plannedDate: input.plannedDate,
      title: input.title ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdatePlannedSessionById(
  id: string,
  patch: { plannedDate?: string; title?: string | null; notes?: string | null }
) {
  const [row] = await db
    .update(plannedSession)
    .set({
      plannedDate: patch.plannedDate,
      title: patch.title,
      notes: patch.notes,
      updatedAt: new Date(),
    })
    .where(eq(plannedSession.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeletePlannedSessionById(id: string) {
  await db.delete(plannedSession).where(eq(plannedSession.id, id));
}
