import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  plannedSession,
  plannedSessionBlock,
  plannedSet,
  plannedWorkout,
} from "@/infrastructure/db/schema";
import type {
  TPlannedSessionRow,
  TListPlannedSessionsInput,
  TGetPlannedSessionInput,
  TCreatePlannedSessionInput,
  TPatchPlannedSessionInput,
  TDeletePlannedSessionInput,
  TPlannedSessionBlockRow,
  TListPlannedBlocksInput,
  TGetPlannedBlockInput,
  TCreatePlannedBlockInput,
  TPatchPlannedBlockInput,
  TDeletePlannedBlockInput,
  TPlannedSetRow,
  TListPlannedSetsInput,
  TGetPlannedSetInput,
  TCreatePlannedSetInput,
  TPatchPlannedSetInput,
  TDeletePlannedSetInput,
  TPlannedWorkoutRow,
  TListPlannedWorkoutsInput,
  TGetPlannedWorkoutInput,
  TCreatePlannedWorkoutInput,
  TPatchPlannedWorkoutInput,
  TDeletePlannedWorkoutInput,
} from "./dto";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const planningRepository = {
  async listPlannedSessions(
    input: TListPlannedSessionsInput
  ): Promise<TPlannedSessionRow[]> {
    const limit = clamp(input.limit ?? 50, 1, 200);
    const offset = Math.max(input.offset ?? 0, 0);

    const filters = [eq(plannedSession.orgId, input.orgId)];
    if (input.athleteId)
      filters.push(eq(plannedSession.athleteId, input.athleteId));
    if (input.dateFrom)
      filters.push(gte(plannedSession.plannedDate, input.dateFrom));
    if (input.dateTo)
      filters.push(lte(plannedSession.plannedDate, input.dateTo));

    const col =
      input.orderBy === "title"
        ? plannedSession.title
        : input.orderBy === "createdAt"
          ? plannedSession.createdAt
          : input.orderBy === "updatedAt"
            ? plannedSession.updatedAt
            : input.orderBy === "plannedDate"
              ? plannedSession.plannedDate
              : plannedSession.id;

    const dir = (input.order ?? "asc") === "desc" ? desc(col) : asc(col);

    return db
      .select()
      .from(plannedSession)
      .where(and(...filters))
      .orderBy(dir)
      .limit(limit)
      .offset(offset);
  },

  async getPlannedSession(
    input: TGetPlannedSessionInput
  ): Promise<TPlannedSessionRow | null> {
    const rows = await db
      .select()
      .from(plannedSession)
      .where(
        and(
          eq(plannedSession.orgId, input.orgId),
          eq(plannedSession.id, input.id)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async createPlannedSession(
    input: TCreatePlannedSessionInput
  ): Promise<TPlannedSessionRow> {
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
  },

  async updatePlannedSession(
    input: TPatchPlannedSessionInput
  ): Promise<TPlannedSessionRow | null> {
    const [row] = await db
      .update(plannedSession)
      .set({
        ...(input.athleteId !== undefined
          ? { athleteId: input.athleteId }
          : {}),
        ...(input.plannedDate !== undefined
          ? { plannedDate: input.plannedDate }
          : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      })
      .where(
        and(
          eq(plannedSession.orgId, input.orgId),
          eq(plannedSession.id, input.id)
        )
      )
      .returning();
    return row ?? null;
  },

  async deletePlannedSession(input: TDeletePlannedSessionInput): Promise<void> {
    await db
      .delete(plannedSession)
      .where(
        and(
          eq(plannedSession.orgId, input.orgId),
          eq(plannedSession.id, input.id)
        )
      );
  },

  async listPlannedBlocks(
    input: TListPlannedBlocksInput
  ): Promise<TPlannedSessionBlockRow[]> {
    return db
      .select()
      .from(plannedSessionBlock)
      .where(eq(plannedSessionBlock.plannedSessionId, input.plannedSessionId))
      .orderBy(asc(plannedSessionBlock.blockIndex));
  },

  async getPlannedBlock(
    input: TGetPlannedBlockInput
  ): Promise<TPlannedSessionBlockRow | null> {
    const rows = await db
      .select({
        id: plannedSessionBlock.id,
        plannedSessionId: plannedSessionBlock.plannedSessionId,
        blockIndex: plannedSessionBlock.blockIndex,
        blockType: plannedSessionBlock.blockType,
        title: plannedSessionBlock.title,
        notes: plannedSessionBlock.notes,
      })
      .from(plannedSessionBlock)
      .innerJoin(
        plannedSession,
        eq(plannedSession.id, plannedSessionBlock.plannedSessionId)
      )
      .where(
        and(
          eq(plannedSession.orgId, input.orgId),
          eq(plannedSessionBlock.id, input.id)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async nextBlockIndex(plannedSessionId: string): Promise<number> {
    const rows = await db
      .select({ idx: plannedSessionBlock.blockIndex })
      .from(plannedSessionBlock)
      .where(eq(plannedSessionBlock.plannedSessionId, plannedSessionId))
      .orderBy(desc(plannedSessionBlock.blockIndex))
      .limit(1);
    return rows[0]?.idx != null ? rows[0].idx + 1 : 0;
  },

  async createPlannedBlock(
    input: TCreatePlannedBlockInput & { resolvedIndex: number }
  ): Promise<TPlannedSessionBlockRow> {
    const [row] = await db
      .insert(plannedSessionBlock)
      .values({
        plannedSessionId: input.plannedSessionId,
        blockIndex: input.resolvedIndex,
        blockType: input.blockType ?? null,
        title: input.title ?? null,
        notes: input.notes ?? null,
      })
      .returning();
    return row!;
  },

  async updatePlannedBlock(
    input: TPatchPlannedBlockInput
  ): Promise<TPlannedSessionBlockRow | null> {
    const [row] = await db
      .update(plannedSessionBlock)
      .set({
        ...(input.blockIndex !== undefined
          ? { blockIndex: input.blockIndex ?? 0 }
          : {}),
        ...(input.blockType !== undefined
          ? { blockType: input.blockType }
          : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      })
      .where(eq(plannedSessionBlock.id, input.id))
      .returning();
    return row ?? null;
  },

  async deletePlannedBlock(input: TDeletePlannedBlockInput): Promise<void> {
    await db
      .delete(plannedSessionBlock)
      .where(eq(plannedSessionBlock.id, input.id));
  },

  async listPlannedSets(
    input: TListPlannedSetsInput
  ): Promise<TPlannedSetRow[]> {
    return db
      .select()
      .from(plannedSet)
      .where(eq(plannedSet.plannedSessionBlockId, input.plannedSessionBlockId))
      .orderBy(asc(plannedSet.setIndex));
  },

  async getPlannedSet(
    input: TGetPlannedSetInput
  ): Promise<TPlannedSetRow | null> {
    const rows = await db
      .select({
        id: plannedSet.id,
        plannedSessionBlockId: plannedSet.plannedSessionBlockId,
        exerciseId: plannedSet.exerciseId,
        setIndex: plannedSet.setIndex,
        targetReps: plannedSet.targetReps,
        targetLoadKg: plannedSet.targetLoadKg,
        targetDurationS: plannedSet.targetDurationS,
        prescription: plannedSet.prescription,
      })
      .from(plannedSet)
      .innerJoin(
        plannedSessionBlock,
        eq(plannedSessionBlock.id, plannedSet.plannedSessionBlockId)
      )
      .innerJoin(
        plannedSession,
        eq(plannedSession.id, plannedSessionBlock.plannedSessionId)
      )
      .where(
        and(eq(plannedSession.orgId, input.orgId), eq(plannedSet.id, input.id))
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async nextSetIndex(plannedSessionBlockId: string): Promise<number> {
    const rows = await db
      .select({ idx: plannedSet.setIndex })
      .from(plannedSet)
      .where(eq(plannedSet.plannedSessionBlockId, plannedSessionBlockId))
      .orderBy(desc(plannedSet.setIndex))
      .limit(1);
    return rows[0]?.idx != null ? rows[0].idx + 1 : 0;
  },

  async createPlannedSet(
    input: TCreatePlannedSetInput & { resolvedIndex: number }
  ): Promise<TPlannedSetRow> {
    const [row] = await db
      .insert(plannedSet)
      .values({
        plannedSessionBlockId: input.plannedSessionBlockId,
        exerciseId: input.exerciseId,
        setIndex: input.resolvedIndex,
        targetReps: input.targetReps ?? null,
        targetLoadKg: input.targetLoadKg ?? null,
        targetDurationS: input.targetDurationS ?? null,
        prescription: input.prescription ?? null,
      })
      .returning();
    return row!;
  },

  async updatePlannedSet(
    input: TPatchPlannedSetInput
  ): Promise<TPlannedSetRow | null> {
    const [row] = await db
      .update(plannedSet)
      .set({
        ...(input.exerciseId !== undefined
          ? { exerciseId: input.exerciseId }
          : {}),
        ...(input.setIndex !== undefined
          ? { setIndex: input.setIndex ?? 0 }
          : {}),
        ...(input.targetReps !== undefined
          ? { targetReps: input.targetReps }
          : {}),
        ...(input.targetLoadKg !== undefined
          ? { targetLoadKg: input.targetLoadKg }
          : {}),
        ...(input.targetDurationS !== undefined
          ? { targetDurationS: input.targetDurationS }
          : {}),
        ...(input.prescription !== undefined
          ? { prescription: input.prescription }
          : {}),
      })
      .where(eq(plannedSet.id, input.id))
      .returning();
    return row ?? null;
  },

  async deletePlannedSet(input: TDeletePlannedSetInput): Promise<void> {
    await db.delete(plannedSet).where(eq(plannedSet.id, input.id));
  },

  async listPlannedWorkouts(
    input: TListPlannedWorkoutsInput
  ): Promise<TPlannedWorkoutRow[]> {
    return db
      .select()
      .from(plannedWorkout)
      .where(
        eq(plannedWorkout.plannedSessionBlockId, input.plannedSessionBlockId)
      );
  },

  async getPlannedWorkout(
    input: TGetPlannedWorkoutInput
  ): Promise<TPlannedWorkoutRow | null> {
    const rows = await db
      .select({
        id: plannedWorkout.id,
        plannedSessionBlockId: plannedWorkout.plannedSessionBlockId,
        workoutId: plannedWorkout.workoutId,
        targetResult: plannedWorkout.targetResult,
      })
      .from(plannedWorkout)
      .innerJoin(
        plannedSessionBlock,
        eq(plannedSessionBlock.id, plannedWorkout.plannedSessionBlockId)
      )
      .innerJoin(
        plannedSession,
        eq(plannedSession.id, plannedSessionBlock.plannedSessionId)
      )
      .where(
        and(
          eq(plannedSession.orgId, input.orgId),
          eq(plannedWorkout.id, input.id)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async createPlannedWorkout(
    input: TCreatePlannedWorkoutInput
  ): Promise<TPlannedWorkoutRow> {
    const [row] = await db
      .insert(plannedWorkout)
      .values({
        plannedSessionBlockId: input.plannedSessionBlockId,
        workoutId: input.workoutId,
        targetResult: input.targetResult ?? null,
      })
      .returning();
    return row!;
  },

  async updatePlannedWorkout(
    input: TPatchPlannedWorkoutInput
  ): Promise<TPlannedWorkoutRow | null> {
    const [row] = await db
      .update(plannedWorkout)
      .set({
        ...(input.workoutId !== undefined
          ? { workoutId: input.workoutId }
          : {}),
        ...(input.targetResult !== undefined
          ? { targetResult: input.targetResult }
          : {}),
      })
      .where(eq(plannedWorkout.id, input.id))
      .returning();
    return row ?? null;
  },

  async deletePlannedWorkout(input: TDeletePlannedWorkoutInput): Promise<void> {
    await db.delete(plannedWorkout).where(eq(plannedWorkout.id, input.id));
  },
};
