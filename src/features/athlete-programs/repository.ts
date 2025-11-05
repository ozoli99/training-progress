import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { athleteProgram, athlete, program } from "@/infrastructure/db/schema";

type ListArgs = {
  orgId: string;
  athleteId: string;
  limit: number;
  offset: number;
  isActive?: boolean;
  programId?: string;
  order: "asc" | "desc";
};

export async function repoListAthletePrograms(args: ListArgs) {
  const { orgId, athleteId, limit, offset, isActive, programId, order } = args;

  const where = and(
    eq(athleteProgram.orgId, orgId),
    eq(athleteProgram.athleteId, athleteId),
    isActive === undefined ? undefined : eq(athleteProgram.isActive, isActive),
    programId ? eq(athleteProgram.programId, programId) : undefined
  );

  const rows = await db
    .select()
    .from(athleteProgram)
    .where(where)
    .orderBy(
      order === "asc"
        ? asc(athleteProgram.startDate)
        : desc(athleteProgram.startDate)
    )
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function repoGetAthleteProgramById(id: string) {
  const [row] = await db
    .select()
    .from(athleteProgram)
    .where(eq(athleteProgram.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoInsertAthleteProgram(input: {
  orgId: string;
  athleteId: string;
  programId: string;
  startDate: string;
  currentWeek: number;
  isActive: boolean;
}) {
  const [row] = await db
    .insert(athleteProgram)
    .values({
      orgId: input.orgId,
      athleteId: input.athleteId,
      programId: input.programId,
      startDate: input.startDate,
      currentWeek: input.currentWeek,
      isActive: input.isActive,
    })
    .returning();
  return row!;
}

export async function repoUpdateAthleteProgramById(
  id: string,
  patch: {
    startDate?: string;
    currentWeek?: number;
    isActive?: boolean;
  }
) {
  const [row] = await db
    .update(athleteProgram)
    .set({
      startDate: patch.startDate ?? undefined,
      currentWeek: patch.currentWeek ?? undefined,
      isActive: patch.isActive ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(athleteProgram.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteAthleteProgramById(id: string) {
  await db.delete(athleteProgram).where(eq(athleteProgram.id, id));
}

export async function repoAthleteExists(orgId: string, athleteId: string) {
  const [row] = await db
    .select({ id: athlete.id })
    .from(athlete)
    .where(and(eq(athlete.id, athleteId), eq(athlete.orgId, orgId)))
    .limit(1);
  return !!row;
}

export async function repoProgramExists(orgId: string, programId: string) {
  const [row] = await db
    .select({ id: program.id })
    .from(program)
    .where(and(eq(program.id, programId), eq(program.orgId, orgId)))
    .limit(1);
  return !!row;
}

export async function repoHasAnotherActiveForSameProgram(params: {
  orgId: string;
  athleteId: string;
  programId: string;
  excludeId?: string;
}) {
  const where = and(
    eq(athleteProgram.orgId, params.orgId),
    eq(athleteProgram.athleteId, params.athleteId),
    eq(athleteProgram.programId, params.programId),
    eq(athleteProgram.isActive, true),
    params.excludeId ? ne(athleteProgram.id, params.excludeId) : undefined
  );

  const rows = await db
    .select({ id: athleteProgram.id })
    .from(athleteProgram)
    .where(where);

  const filtered = params.excludeId
    ? rows.filter((r) => r.id !== params.excludeId)
    : rows;

  return filtered.length > 0;
}
