// features/skills/service.ts

import { AppError } from "@/shared/errors";
import type {
  TCreateSkillInput,
  TDeleteSkillInput,
  TGetSkillInput,
  TListSkillsInput,
  TPatchSkillInput,
  TSkillLogRow,
} from "./dto";
import {
  makeSkillsRepository,
  skillsRepository as defaultRepo,
} from "./repository";

export interface SkillsService {
  list(input: TListSkillsInput): Promise<TSkillLogRow[]>;
  getById(input: TGetSkillInput): Promise<TSkillLogRow | null>;
  create(input: TCreateSkillInput): Promise<TSkillLogRow>;
  update(input: TPatchSkillInput): Promise<TSkillLogRow>;
  delete(input: TDeleteSkillInput): Promise<void>;
}

export function makeSkillsService(
  repo: ReturnType<typeof makeSkillsRepository> = defaultRepo
): SkillsService {
  return {
    async list(input) {
      if (!input.orgId) throw new AppError.BadRequest("orgId is required");
      if (!input.athleteId)
        throw new AppError.BadRequest("athleteId is required");
      if (!input.sessionId)
        throw new AppError.BadRequest("sessionId is required");
      return repo.list(input);
    },

    async getById(input) {
      if (
        !input.orgId ||
        !input.athleteId ||
        !input.sessionId ||
        !input.skillLogId
      ) {
        throw new AppError.BadRequest(
          "orgId, athleteId, sessionId and skillLogId are required"
        );
      }
      return repo.getById(input);
    },

    async create(input) {
      if (!input.orgId) throw new AppError.BadRequest("orgId is required");
      if (!input.athleteId)
        throw new AppError.BadRequest("athleteId is required");
      if (!input.sessionId)
        throw new AppError.BadRequest("sessionId is required");

      // light validation
      if (input.attempts != null && input.attempts < 0) {
        throw new AppError.BadRequest("attempts cannot be negative");
      }
      if (input.successes != null && input.successes < 0) {
        throw new AppError.BadRequest("successes cannot be negative");
      }
      if (input.qualityScore != null && input.qualityScore < 0) {
        throw new AppError.BadRequest("qualityScore cannot be negative");
      }

      return repo.create(input);
    },

    async update(input) {
      if (
        !input.orgId ||
        !input.athleteId ||
        !input.sessionId ||
        !input.skillLogId
      ) {
        throw new AppError.BadRequest(
          "orgId, athleteId, sessionId and skillLogId are required"
        );
      }
      if (input.attempts != null && input.attempts < 0) {
        throw new AppError.BadRequest("attempts cannot be negative");
      }
      if (input.successes != null && input.successes < 0) {
        throw new AppError.BadRequest("successes cannot be negative");
      }
      if (input.qualityScore != null && input.qualityScore < 0) {
        throw new AppError.BadRequest("qualityScore cannot be negative");
      }

      return repo.update(input);
    },

    async delete(input) {
      if (
        !input.orgId ||
        !input.athleteId ||
        !input.sessionId ||
        !input.skillLogId
      ) {
        throw new AppError.BadRequest(
          "orgId, athleteId, sessionId and skillLogId are required"
        );
      }
      await repo.delete(input);
    },
  };
}

export const skillsService = makeSkillsService();
