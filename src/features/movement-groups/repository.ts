import { db } from "@/infrastructure/db/client";
import {
  movementGroup,
  exerciseMovementGroup,
  exercise,
} from "@/infrastructure/db/schema";
import { and, eq, like } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type MovementGroupRow = InferSelectModel<typeof movementGroup>;
export type NewMovementGroupRow = InferInsertModel<typeof movementGroup>;

export async function insertMovementGroup(values: NewMovementGroupRow) {
  const [row] = await db.insert(movementGroup).values(values).returning();
  return row!;
}

export async function getMovementGroupById(id: string) {
  const rows = await db
    .select()
    .from(movementGroup)
    .where(eq(movementGroup.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getMovementGroupByOrgAndName(
  orgId: string,
  name: string
) {
  const rows = await db
    .select()
    .from(movementGroup)
    .where(and(eq(movementGroup.orgId, orgId), eq(movementGroup.name, name)))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateMovementGroupById(
  id: string,
  patch: Partial<MovementGroupRow>
) {
  const [row] = await db
    .update(movementGroup)
    .set(patch as any)
    .where(eq(movementGroup.id, id))
    .returning();
  return row ?? null;
}

export async function deleteMovementGroupById(id: string) {
  await db.delete(movementGroup).where(eq(movementGroup.id, id));
}

export async function listMovementGroups(opts: {
  orgId: string;
  limit: number;
  offset: number;
  q?: string;
  isActive?: boolean;
}) {
  const filters = [
    eq(movementGroup.orgId, opts.orgId),
    opts.q ? like(movementGroup.name, `%${opts.q}%`) : undefined,
    typeof opts.isActive === "boolean"
      ? eq(movementGroup.isActive, opts.isActive)
      : undefined,
  ].filter(Boolean) as any[];

  return db
    .select()
    .from(movementGroup)
    .where(and(...filters))
    .orderBy(movementGroup.name)
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function listExercisesInMovementGroup(movementGroupId: string) {
  return db
    .select({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      modality: exercise.modality,
    })
    .from(exerciseMovementGroup)
    .innerJoin(exercise, eq(exercise.id, exerciseMovementGroup.exerciseId))
    .where(eq(exerciseMovementGroup.movementGroupId, movementGroupId));
}
