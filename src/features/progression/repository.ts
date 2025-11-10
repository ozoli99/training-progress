import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  progressionRule,
  progressionRun,
  progressionAction,
} from "@/infrastructure/db/schema";
import type {
  TListRulesInput,
  TGetRuleInput,
  TCreateRuleInput,
  TPatchRuleInput,
  TDeleteRuleInput,
  TListRunsInput,
  TGetRunInput,
  TTriggerRunInput,
  TListActionsInput,
  TProgressionRuleRow,
  TProgressionRunRow,
  TProgressionActionRow,
} from "./dto";

export const progressionRepository = {
  async listRules(input: TListRulesInput): Promise<TProgressionRuleRow[]> {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const offset = Math.max(input.offset ?? 0, 0);

    const filters = [eq(progressionRule.orgId, input.orgId)];
    if (input.activeOnly === true) {
      filters.push(eq(progressionRule.active, true));
    }
    if (input.appliesTo) {
      filters.push(eq(progressionRule.appliesTo, input.appliesTo));
    }
    if (input.exerciseId != null) {
      filters.push(eq(progressionRule.exerciseId, input.exerciseId));
    }
    if (input.workoutId != null) {
      filters.push(eq(progressionRule.workoutId, input.workoutId));
    }

    const orderCol =
      input.orderBy === "name" ? progressionRule.name : progressionRule.id;

    const orderDir = input.order === "desc" ? desc(orderCol) : asc(orderCol);

    return db
      .select()
      .from(progressionRule)
      .where(and(...filters))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
  },

  async getRuleById(input: TGetRuleInput): Promise<TProgressionRuleRow | null> {
    const rows = await db
      .select()
      .from(progressionRule)
      .where(
        and(
          eq(progressionRule.orgId, input.orgId),
          eq(progressionRule.id, input.ruleId)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async createRule(input: TCreateRuleInput): Promise<TProgressionRuleRow> {
    const [row] = await db
      .insert(progressionRule)
      .values({
        orgId: input.orgId,
        name: input.name,
        appliesTo: input.appliesTo ?? null,
        exerciseId: input.exerciseId ?? null,
        workoutId: input.workoutId ?? null,
        conditionJson: (input.conditionJson as any) ?? null,
        active: input.active ?? true,
      })
      .returning();
    return row;
  },

  async updateRule(input: TPatchRuleInput): Promise<TProgressionRuleRow> {
    const [row] = await db
      .update(progressionRule)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.appliesTo !== undefined
          ? { appliesTo: input.appliesTo }
          : {}),
        ...(input.exerciseId !== undefined
          ? { exerciseId: input.exerciseId }
          : {}),
        ...(input.workoutId !== undefined
          ? { workoutId: input.workoutId }
          : {}),
        ...(input.conditionJson !== undefined
          ? { conditionJson: input.conditionJson as any }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      })
      .where(
        and(
          eq(progressionRule.orgId, input.orgId),
          eq(progressionRule.id, input.ruleId)
        )
      )
      .returning();
    return row!;
  },

  async deleteRule(input: TDeleteRuleInput): Promise<void> {
    await db
      .delete(progressionRule)
      .where(
        and(
          eq(progressionRule.orgId, input.orgId),
          eq(progressionRule.id, input.ruleId)
        )
      );
  },

  async listRuns(input: TListRunsInput): Promise<TProgressionRunRow[]> {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const offset = Math.max(input.offset ?? 0, 0);

    const filters = [eq(progressionRun.orgId, input.orgId)];
    if (input.ruleId) {
      filters.push(eq(progressionRun.progressionRuleId, input.ruleId));
    }

    const orderCol =
      input.orderBy === "status"
        ? progressionRun.status
        : progressionRun.executedAt;

    const orderDir = input.order === "asc" ? asc(orderCol) : desc(orderCol);

    return db
      .select()
      .from(progressionRun)
      .where(and(...filters))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
  },

  async getRunById(input: TGetRunInput): Promise<TProgressionRunRow | null> {
    const rows = await db
      .select()
      .from(progressionRun)
      .where(
        and(
          eq(progressionRun.orgId, input.orgId),
          eq(progressionRun.id, input.runId)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async createRun(
    input: TTriggerRunInput & { status?: string }
  ): Promise<TProgressionRunRow> {
    const [row] = await db
      .insert(progressionRun)
      .values({
        orgId: input.orgId,
        progressionRuleId: input.ruleId,
        status: input.status ?? "queued",
        context: (input.context as any) ?? null,
      })
      .returning();
    return row;
  },

  async listActions(
    input: TListActionsInput
  ): Promise<TProgressionActionRow[]> {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const offset = Math.max(input.offset ?? 0, 0);

    const filters = [eq(progressionAction.orgId, input.orgId)];
    if (input.ruleId) {
      filters.push(eq(progressionAction.progressionRuleId, input.ruleId));
    }
    if (input.runId) {
      filters.push(eq(progressionAction.progressionRunId, input.runId));
    }

    const orderDir =
      input.order === "desc"
        ? desc(progressionAction.id)
        : asc(progressionAction.id);

    return db
      .select()
      .from(progressionAction)
      .where(and(...filters))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
  },

  async createActions(
    orgId: string,
    ruleId: string,
    runId: string,
    actions: Array<{
      actionType: string;
      actionPayload?: Record<string, unknown> | null;
    }>
  ): Promise<TProgressionActionRow[]> {
    if (!actions.length) return [];
    const rows = await db
      .insert(progressionAction)
      .values(
        actions.map((a) => ({
          orgId,
          progressionRuleId: ruleId,
          progressionRunId: runId,
          actionType: a.actionType,
          actionPayload: (a.actionPayload as any) ?? null,
        }))
      )
      .returning();
    return rows;
  },
};
