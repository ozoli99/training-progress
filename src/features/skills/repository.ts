import { db } from "@/infrastructure/db/client";
import { skillLog } from "@/infrastructure/db/schema";
import { and, asc, eq } from "drizzle-orm";

export async function repoListSkillsBySession(sessionId: string) {
  return db
    .select()
    .from(skillLog)
    .where(eq(skillLog.sessionId, sessionId))
    .orderBy(asc(skillLog.sessionBlockId));
}

export async function repoListSkillsByBlock(
  sessionId: string,
  sessionBlockId?: string | null
) {
  if (!sessionBlockId) return repoListSkillsBySession(sessionId);
  return db
    .select()
    .from(skillLog)
    .where(
      and(
        eq(skillLog.sessionId, sessionId),
        eq(skillLog.sessionBlockId, sessionBlockId)
      )
    )
    .orderBy(asc(skillLog.id));
}

export async function repoGetSkillById(id: string) {
  const [row] = await db
    .select()
    .from(skillLog)
    .where(eq(skillLog.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoInsertSkill(input: {
  sessionId: string;
  sessionBlockId?: string | null;
  exerciseId?: string | null;
  attempts?: number | null;
  successes?: number | null;
  qualityScore?: string | number | null;
  notes?: string | null;
}) {
  const [row] = await db
    .insert(skillLog)
    .values({
      sessionId: input.sessionId,
      sessionBlockId: input.sessionBlockId ?? null,
      exerciseId: input.exerciseId ?? null,
      attempts: input.attempts ?? null,
      successes: input.successes ?? null,
      qualityScore: (input as any).qualityScore ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdateSkill(
  id: string,
  patch: {
    sessionBlockId?: string | null;
    exerciseId?: string | null;
    attempts?: number | null;
    successes?: number | null;
    qualityScore?: string | number | null;
    notes?: string | null;
  }
) {
  const [row] = await db
    .update(skillLog)
    .set({
      sessionBlockId: patch.sessionBlockId ?? undefined,
      exerciseId: patch.exerciseId ?? undefined,
      attempts: patch.attempts ?? undefined,
      successes: patch.successes ?? undefined,
      qualityScore: (patch as any).qualityScore ?? undefined,
      notes: patch.notes ?? undefined,
    })
    .where(eq(skillLog.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteSkill(id: string) {
  await db.delete(skillLog).where(eq(skillLog.id, id));
}
