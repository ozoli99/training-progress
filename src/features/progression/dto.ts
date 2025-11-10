import type { InferSelectModel } from "drizzle-orm";
import {
  progressionRule,
  progressionRun,
  progressionAction,
} from "@/infrastructure/db/schema";

export type TProgressionRuleRow = InferSelectModel<typeof progressionRule>;
export type TProgressionRunRow = InferSelectModel<typeof progressionRun>;
export type TProgressionActionRow = InferSelectModel<typeof progressionAction>;

export type TListRulesInput = {
  orgId: string;
  activeOnly?: boolean;
  appliesTo?: "exercise" | "workout";
  exerciseId?: string | null;
  workoutId?: string | null;
  limit?: number;
  offset?: number;
  orderBy?: "name" | "id";
  order?: "asc" | "desc";
};

export type TGetRuleInput = {
  orgId: string;
  ruleId: string;
};

export type TCreateRuleInput = {
  orgId: string;
  name: string;
  appliesTo?: "exercise" | "workout" | null;
  exerciseId?: string | null;
  workoutId?: string | null;
  conditionJson?: Record<string, unknown> | null;
  active?: boolean;
};

export type TPatchRuleInput = {
  orgId: string;
  ruleId: string;
  name?: string;
  appliesTo?: "exercise" | "workout" | null;
  exerciseId?: string | null;
  workoutId?: string | null;
  conditionJson?: Record<string, unknown> | null;
  active?: boolean;
};

export type TDeleteRuleInput = {
  orgId: string;
  ruleId: string;
};

export type TListRunsInput = {
  orgId: string;
  ruleId?: string;
  limit?: number;
  offset?: number;
  orderBy?: "executedAt" | "status";
  order?: "asc" | "desc";
};

export type TGetRunInput = {
  orgId: string;
  runId: string;
};

export type TTriggerRunInput = {
  orgId: string;
  ruleId: string;
  context?: Record<string, unknown> | null;
};

export type TListActionsInput = {
  orgId: string;
  ruleId?: string;
  runId?: string;
  limit?: number;
  offset?: number;
  orderBy?: "id";
  order?: "asc" | "desc";
};
