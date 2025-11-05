import { db } from "@/infrastructure/db/client";
import {
  exercise,
  exerciseMovementGroup,
  movementGroup,
  type exercise as exerciseTable,
} from "@/infrastructure/db/schema";
import { and, eq, like, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type ExerciseRow = InferSelectModel<typeof exercise>;
export type NewExerciseRow = InferInsertModel<typeof exercise>;

export async function insertExercise(
  values: NewExerciseRow
): Promise<ExerciseRow> {
  const [row] = await db.insert(exercise).values(values).returning();
  return row!;
}

export async function getExerciseById(id: string): Promise<ExerciseRow | null> {
  const rows = await db
    .select()
    .from(exercise)
    .where(eq(exercise.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getExerciseByOrgAndName(orgId: string, name: string) {
  const rows = await db
    .select()
    .from(exercise)
    .where(and(eq(exercise.orgId, orgId), eq(exercise.name, name)))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateExerciseById(
  id: string,
  patch: Partial<ExerciseRow>
): Promise<ExerciseRow | null> {
  const [row] = await db
    .update(exercise)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(exercise.id, id))
    .returning();
  return row ?? null;
}

export async function deleteExerciseById(id: string) {
  await db.delete(exercise).where(eq(exercise.id, id));
}

export async function listExercises(opts: {
  orgId: string;
  limit: number;
  offset: number;
  q?: string;
  category?: string;
  modality?: string;
}): Promise<ExerciseRow[]> {
  const filters = [
    eq(exercise.orgId, opts.orgId),
    opts.q ? like(exercise.name, `%${opts.q}%`) : undefined,
    opts.category ? eq(exercise.category, opts.category) : undefined,
    opts.modality ? eq(exercise.modality, opts.modality) : undefined,
  ].filter(Boolean) as any[];

  return db
    .select()
    .from(exercise)
    .where(and(...filters))
    .orderBy(exercise.createdAt)
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function listExerciseMovementGroups(exerciseId: string) {
  const rows = await db
    .select({
      id: movementGroup.id,
      name: movementGroup.name,
      description: movementGroup.description,
      isActive: movementGroup.isActive,
    })
    .from(exerciseMovementGroup)
    .innerJoin(
      movementGroup,
      eq(movementGroup.id, exerciseMovementGroup.movementGroupId)
    )
    .where(eq(exerciseMovementGroup.exerciseId, exerciseId));
  return rows;
}

export async function addExerciseMovementGroup(
  exerciseId: string,
  movementGroupId: string
) {
  const [row] = await db
    .insert(exerciseMovementGroup)
    .values({
      exerciseId,
      movementGroupId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function removeExerciseMovementGroup(
  exerciseId: string,
  movementGroupId: string
) {
  await db
    .delete(exerciseMovementGroup)
    .where(
      and(
        eq(exerciseMovementGroup.exerciseId, exerciseId),
        eq(exerciseMovementGroup.movementGroupId, movementGroupId)
      )
    );
}
