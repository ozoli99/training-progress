import { AppError } from "@/shared/errors";
import {
  TCreateRuleInput,
  TDeleteRuleInput,
  TGetRuleInput,
  TListRulesInput,
  TPatchRuleInput,
  TProgressionActionRow,
  TProgressionRuleRow,
  TProgressionRunRow,
  TListRunsInput,
  TGetRunInput,
  TTriggerRunInput,
  TListActionsInput,
} from "./dto";
import { progressionRepository } from "./repository";

function requireNonEmpty(val: string | undefined, msg: string) {
  if (!val || !val.trim()) throw new AppError.Validation(msg);
}
function ensureOneOf<T extends string>(
  val: T | null | undefined,
  choices: readonly T[],
  msg: string
) {
  if (val == null) return;
  if (!choices.includes(val)) throw new AppError.Validation(msg);
}
function validateRuleLinkage(input: {
  appliesTo?: "exercise" | "workout" | null;
  exerciseId?: string | null;
  workoutId?: string | null;
}) {
  if (!input.appliesTo) return;
  if (input.appliesTo === "exercise" && !input.exerciseId) {
    throw new AppError.Validation(
      "exerciseId is required when appliesTo=exercise"
    );
  }
  if (input.appliesTo === "workout" && !input.workoutId) {
    throw new AppError.Validation(
      "workoutId is required when appliesTo=workout"
    );
  }
}

export interface ProgressionService {
  listRules(input: TListRulesInput): Promise<TProgressionRuleRow[]>;
  getRule(input: TGetRuleInput): Promise<TProgressionRuleRow>; // throws 404
  getRuleById(input: TGetRuleInput): Promise<TProgressionRuleRow | null>; // nullable
  createRule(input: TCreateRuleInput): Promise<TProgressionRuleRow>;
  updateRule(input: TPatchRuleInput): Promise<TProgressionRuleRow>;
  deleteRule(input: TDeleteRuleInput): Promise<void>;

  listRuns(input: TListRunsInput): Promise<TProgressionRunRow[]>;
  getRun(input: TGetRunInput): Promise<TProgressionRunRow>; // throws 404
  getRunById(input: TGetRunInput): Promise<TProgressionRunRow | null>; // nullable
  triggerRun(input: TTriggerRunInput): Promise<{
    run: TProgressionRunRow;
    actions: TProgressionActionRow[];
  }>;

  listActions(input: TListActionsInput): Promise<TProgressionActionRow[]>;
}

export function makeProgressionService(): ProgressionService {
  return {
    async listRules(input) {
      ensureOneOf(
        input.appliesTo,
        ["exercise", "workout"] as const,
        "Invalid appliesTo"
      );
      return progressionRepository.listRules(input);
    },

    async getRule(input) {
      const row = await progressionRepository.getRuleById(input);
      if (!row) throw new AppError.NotFound("Progression rule not found");
      return row;
    },

    async getRuleById(input) {
      return progressionRepository.getRuleById(input);
    },

    async createRule(input) {
      requireNonEmpty(input.name, "Rule name is required");
      ensureOneOf(
        input.appliesTo ?? undefined,
        ["exercise", "workout"] as const,
        "Invalid appliesTo"
      );
      validateRuleLinkage(input);

      return progressionRepository.createRule({
        ...input,
        appliesTo: input.appliesTo ?? null,
        exerciseId: input.exerciseId ?? null,
        workoutId: input.workoutId ?? null,
        conditionJson: input.conditionJson ?? null,
        active: input.active ?? true,
      });
    },

    async updateRule(input) {
      if ("name" in input && input.name !== undefined) {
        requireNonEmpty(input.name, "Rule name cannot be empty");
      }
      if ("appliesTo" in input) {
        ensureOneOf(
          input.appliesTo ?? undefined,
          ["exercise", "workout"] as const,
          "Invalid appliesTo"
        );
      }
      validateRuleLinkage(input);

      const row = await progressionRepository.updateRule(input);
      if (!row) throw new AppError.NotFound("Progression rule not found");
      return row;
    },

    async deleteRule(input) {
      await progressionRepository.deleteRule(input);
    },

    async listRuns(input) {
      return progressionRepository.listRuns(input);
    },

    async getRun(input) {
      const row = await progressionRepository.getRunById(input);
      if (!row) throw new AppError.NotFound("Progression run not found");
      return row;
    },

    async getRunById(input) {
      return progressionRepository.getRunById(input);
    },

    async triggerRun(input) {
      const rule = await progressionRepository.getRuleById({
        orgId: input.orgId,
        ruleId: input.ruleId,
      });
      if (!rule) throw new AppError.NotFound("Progression rule not found");
      if (!rule.active) throw new AppError.Validation("Rule is not active");

      const run = await progressionRepository.createRun({
        ...input,
        status: "queued",
      });

      const actions: TProgressionActionRow[] = [];
      return { run, actions };
    },

    async listActions(input) {
      return progressionRepository.listActions(input);
    },
  };
}

export const progressionService = makeProgressionService();
