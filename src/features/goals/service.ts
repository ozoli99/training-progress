import { AppError } from "@/shared/errors";
import { db } from "@/infrastructure/db/client";
import {
  athleteGoal,
  session as sessionTable,
} from "@/infrastructure/db/schema";
import { and, eq } from "drizzle-orm";
import type {
  TAthleteGoalRow,
  TListGoalsInput,
  TGetGoalInput,
  TCreateGoalInput,
  TPatchGoalInput,
  TDeleteGoalInput,
  TAthleteGoalProgressRow,
  TListGoalProgressInput,
  TGetGoalProgressInput,
  TCreateGoalProgressInput,
  TPatchGoalProgressInput,
  TDeleteGoalProgressInput,
} from "./dto";
import { goalsRepository, goalProgressRepository } from "./repository";

function requireNonEmpty(val: unknown, msg: string) {
  if (val == null || `${val}`.trim() === "") throw new AppError.Validation(msg);
}

async function ensureGoalBelongsToOrg(goalId: string, orgId: string) {
  const rows = await db
    .select({ id: athleteGoal.id })
    .from(athleteGoal)
    .where(and(eq(athleteGoal.id, goalId), eq(athleteGoal.orgId, orgId)))
    .limit(1);
  if (!rows[0]) throw new AppError.Forbidden("Goal does not belong to org.");
}

async function ensureProgressBelongsToOrg(progressId: string, orgId: string) {
  const row = await goalProgressRepository.get({ orgId, id: progressId });
  if (!row) throw new AppError.NotFound("Goal progress not found");
}

async function ensureSessionOrgIfProvided(
  orgId: string,
  sessionId?: string | null
) {
  if (!sessionId) return;
  const rows = await db
    .select({ id: sessionTable.id, orgId: sessionTable.orgId })
    .from(sessionTable)
    .where(eq(sessionTable.id, sessionId))
    .limit(1);
  if (!rows[0]) throw new AppError.Validation("sessionId invalid");
  if (rows[0].orgId !== orgId)
    throw new AppError.Forbidden("Session does not belong to this org.");
}

export interface GoalsService {
  listGoals(i: TListGoalsInput): Promise<TAthleteGoalRow[]>;
  getGoal(i: TGetGoalInput): Promise<TAthleteGoalRow>;
  createGoal(i: TCreateGoalInput): Promise<TAthleteGoalRow>;
  updateGoal(i: TPatchGoalInput): Promise<TAthleteGoalRow>;
  deleteGoal(i: TDeleteGoalInput): Promise<void>;

  listGoalProgress(
    i: TListGoalProgressInput
  ): Promise<TAthleteGoalProgressRow[]>;
  getGoalProgress(i: TGetGoalProgressInput): Promise<TAthleteGoalProgressRow>;
  createGoalProgress(
    i: TCreateGoalProgressInput
  ): Promise<TAthleteGoalProgressRow>;
  updateGoalProgress(
    i: TPatchGoalProgressInput
  ): Promise<TAthleteGoalProgressRow>;
  deleteGoalProgress(i: TDeleteGoalProgressInput): Promise<void>;
}

export function makeGoalsService(): GoalsService {
  return {
    async listGoals(i) {
      requireNonEmpty(i.orgId, "orgId required");
      return goalsRepository.list(i);
    },

    async getGoal(i) {
      const row = await goalsRepository.get(i);
      if (!row) throw new AppError.NotFound("Goal not found");
      return row;
    },

    async createGoal(i) {
      requireNonEmpty(i.orgId, "orgId required");
      requireNonEmpty(i.athleteId, "athleteId required");
      requireNonEmpty(i.goalType, "goalType required");
      requireNonEmpty(i.title, "title required");
      return goalsRepository.create(i);
    },

    async updateGoal(i) {
      await ensureGoalBelongsToOrg(i.id, i.orgId);
      const row = await goalsRepository.patch(i);
      if (!row) throw new AppError.NotFound("Goal not found");
      return row;
    },

    async deleteGoal(i) {
      await ensureGoalBelongsToOrg(i.id, i.orgId);
      await goalsRepository.del(i);
    },

    async listGoalProgress(i) {
      requireNonEmpty(i.orgId, "orgId required");
      requireNonEmpty(i.athleteGoalId, "athleteGoalId required");
      await ensureGoalBelongsToOrg(i.athleteGoalId, i.orgId);
      return goalProgressRepository.list(i);
    },

    async getGoalProgress(i) {
      const row = await goalProgressRepository.get(i);
      if (!row) throw new AppError.NotFound("Goal progress not found");
      return row;
    },

    async createGoalProgress(i) {
      requireNonEmpty(i.orgId, "orgId required");
      requireNonEmpty(i.athleteGoalId, "athleteGoalId required");
      await ensureGoalBelongsToOrg(i.athleteGoalId, i.orgId);
      await ensureSessionOrgIfProvided(i.orgId, i.sessionId ?? null);
      return goalProgressRepository.create(i);
    },

    async updateGoalProgress(i) {
      await ensureProgressBelongsToOrg(i.id, i.orgId);
      await ensureSessionOrgIfProvided(i.orgId, i.sessionId ?? null);
      const row = await goalProgressRepository.patch(i);
      if (!row) throw new AppError.NotFound("Goal progress not found");
      return row;
    },

    async deleteGoalProgress(i) {
      await ensureProgressBelongsToOrg(i.id, i.orgId);
      await goalProgressRepository.del(i);
    },
  };
}

export const goalsService = makeGoalsService();
