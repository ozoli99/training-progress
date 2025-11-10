import { AppError } from "@/shared/errors";
import {
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
import { planningRepository } from "./repository";
import { db } from "@/infrastructure/db/client";
import {
  plannedSession,
  plannedSessionBlock,
} from "@/infrastructure/db/schema";
import { and, eq } from "drizzle-orm";

function requireNonEmpty(val: string | undefined | null, msg: string) {
  if (!val || !`${val}`.trim()) throw new AppError.Validation(msg);
}

async function ensureSessionBelongsToOrg(sessionId: string, orgId: string) {
  const rows = await db
    .select({ id: plannedSession.id })
    .from(plannedSession)
    .where(
      and(eq(plannedSession.id, sessionId), eq(plannedSession.orgId, orgId))
    )
    .limit(1);
  if (!rows[0]) throw new AppError.Forbidden("Session does not belong to org.");
}

async function ensureBlockBelongsToOrg(blockId: string, orgId: string) {
  const rows = await db
    .select({ id: plannedSessionBlock.id })
    .from(plannedSessionBlock)
    .innerJoin(
      plannedSession,
      eq(plannedSession.id, plannedSessionBlock.plannedSessionId)
    )
    .where(
      and(eq(plannedSessionBlock.id, blockId), eq(plannedSession.orgId, orgId))
    )
    .limit(1);
  if (!rows[0]) throw new AppError.Forbidden("Block does not belong to org.");
}

export interface PlanningService {
  listPlannedSessions(
    i: TListPlannedSessionsInput
  ): Promise<TPlannedSessionRow[]>;
  getPlannedSession(i: TGetPlannedSessionInput): Promise<TPlannedSessionRow>;
  createPlannedSession(
    i: TCreatePlannedSessionInput
  ): Promise<TPlannedSessionRow>;
  updatePlannedSession(
    i: TPatchPlannedSessionInput
  ): Promise<TPlannedSessionRow>;
  deletePlannedSession(i: TDeletePlannedSessionInput): Promise<void>;

  listPlannedBlocks(
    i: TListPlannedBlocksInput
  ): Promise<TPlannedSessionBlockRow[]>;
  getPlannedBlock(i: TGetPlannedBlockInput): Promise<TPlannedSessionBlockRow>;
  createPlannedBlock(
    i: TCreatePlannedBlockInput
  ): Promise<TPlannedSessionBlockRow>;
  updatePlannedBlock(
    i: TPatchPlannedBlockInput
  ): Promise<TPlannedSessionBlockRow>;
  deletePlannedBlock(i: TDeletePlannedBlockInput): Promise<void>;

  listPlannedSets(i: TListPlannedSetsInput): Promise<TPlannedSetRow[]>;
  getPlannedSet(i: TGetPlannedSetInput): Promise<TPlannedSetRow>;
  createPlannedSet(i: TCreatePlannedSetInput): Promise<TPlannedSetRow>;
  updatePlannedSet(i: TPatchPlannedSetInput): Promise<TPlannedSetRow>;
  deletePlannedSet(i: TDeletePlannedSetInput): Promise<void>;

  listPlannedWorkouts(
    i: TListPlannedWorkoutsInput
  ): Promise<TPlannedWorkoutRow[]>;
  getPlannedWorkout(i: TGetPlannedWorkoutInput): Promise<TPlannedWorkoutRow>;
  createPlannedWorkout(
    i: TCreatePlannedWorkoutInput
  ): Promise<TPlannedWorkoutRow>;
  updatePlannedWorkout(
    i: TPatchPlannedWorkoutInput
  ): Promise<TPlannedWorkoutRow>;
  deletePlannedWorkout(i: TDeletePlannedWorkoutInput): Promise<void>;
}

export function makePlanningService(): PlanningService {
  return {
    async listPlannedSessions(i) {
      return planningRepository.listPlannedSessions(i);
    },

    async getPlannedSession(i) {
      const row = await planningRepository.getPlannedSession(i);
      if (!row) throw new AppError.NotFound("Planned session not found");
      return row;
    },

    async createPlannedSession(i) {
      requireNonEmpty(i.orgId, "orgId required");
      requireNonEmpty(i.athleteId, "athleteId required");
      requireNonEmpty(i.plannedDate, "plannedDate required");
      return planningRepository.createPlannedSession(i);
    },

    async updatePlannedSession(i) {
      const row = await planningRepository.updatePlannedSession(i);
      if (!row) throw new AppError.NotFound("Planned session not found");
      return row;
    },

    async deletePlannedSession(i) {
      await planningRepository.deletePlannedSession(i);
    },

    async listPlannedBlocks(i) {
      await ensureSessionBelongsToOrg(i.plannedSessionId, i.orgId);
      return planningRepository.listPlannedBlocks(i);
    },

    async getPlannedBlock(i) {
      const row = await planningRepository.getPlannedBlock(i);
      if (!row) throw new AppError.NotFound("Planned block not found");
      return row;
    },

    async createPlannedBlock(i) {
      await ensureSessionBelongsToOrg(i.plannedSessionId, i.orgId);

      const idx =
        i.blockIndex == null
          ? await planningRepository.nextBlockIndex(i.plannedSessionId)
          : i.blockIndex;

      return planningRepository.createPlannedBlock({
        ...i,
        resolvedIndex: idx,
      });
    },

    async updatePlannedBlock(i) {
      await ensureBlockBelongsToOrg(i.id, i.orgId);

      const row = await planningRepository.updatePlannedBlock(i);
      if (!row) throw new AppError.NotFound("Planned block not found");
      return row;
    },

    async deletePlannedBlock(i) {
      await ensureBlockBelongsToOrg(i.id, i.orgId);
      await planningRepository.deletePlannedBlock(i);
    },

    async listPlannedSets(i) {
      const block = await planningRepository.getPlannedBlock({
        orgId: i.orgId,
        id: i.plannedSessionBlockId,
      });
      if (!block) throw new AppError.NotFound("Parent block not found");
      return planningRepository.listPlannedSets(i);
    },

    async getPlannedSet(i) {
      const row = await planningRepository.getPlannedSet(i);
      if (!row) throw new AppError.NotFound("Planned set not found");
      return row;
    },

    async createPlannedSet(i) {
      const block = await planningRepository.getPlannedBlock({
        orgId: i.orgId,
        id: i.plannedSessionBlockId,
      });
      if (!block) throw new AppError.NotFound("Parent block not found");

      const idx =
        i.setIndex == null
          ? await planningRepository.nextSetIndex(i.plannedSessionBlockId)
          : i.setIndex;

      return planningRepository.createPlannedSet({ ...i, resolvedIndex: idx });
    },

    async updatePlannedSet(i) {
      const current = await planningRepository.getPlannedSet(i);
      if (!current) throw new AppError.NotFound("Planned set not found");
      const row = await planningRepository.updatePlannedSet(i);
      if (!row) throw new AppError.NotFound("Planned set not found");
      return row;
    },

    async deletePlannedSet(i) {
      const current = await planningRepository.getPlannedSet(i);
      if (!current) throw new AppError.NotFound("Planned set not found");
      await planningRepository.deletePlannedSet(i);
    },

    async listPlannedWorkouts(i) {
      const block = await planningRepository.getPlannedBlock({
        orgId: i.orgId,
        id: i.plannedSessionBlockId,
      });
      if (!block) throw new AppError.NotFound("Parent block not found");
      return planningRepository.listPlannedWorkouts(i);
    },

    async getPlannedWorkout(i) {
      const row = await planningRepository.getPlannedWorkout(i);
      if (!row) throw new AppError.NotFound("Planned workout not found");
      return row;
    },

    async createPlannedWorkout(i) {
      const block = await planningRepository.getPlannedBlock({
        orgId: i.orgId,
        id: i.plannedSessionBlockId,
      });
      if (!block) throw new AppError.NotFound("Parent block not found");
      return planningRepository.createPlannedWorkout(i);
    },

    async updatePlannedWorkout(i) {
      const current = await planningRepository.getPlannedWorkout(i);
      if (!current) throw new AppError.NotFound("Planned workout not found");
      const row = await planningRepository.updatePlannedWorkout(i);
      if (!row) throw new AppError.NotFound("Planned workout not found");
      return row;
    },

    async deletePlannedWorkout(i) {
      const current = await planningRepository.getPlannedWorkout(i);
      if (!current) throw new AppError.NotFound("Planned workout not found");
      await planningRepository.deletePlannedWorkout(i);
    },
  };
}

export const planningService = makePlanningService();
