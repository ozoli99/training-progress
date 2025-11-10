import { AppError } from "@/shared/errors";
import {
  TCreateBlockInput,
  TCreateProgramInput,
  TCreateSessionInput,
  TDeleteBlockInput,
  TDeleteProgramInput,
  TDeleteSessionInput,
  TGetProgramInput,
  TListBlocksInput,
  TListProgramsInput,
  TListSessionsInput,
  TPatchBlockInput,
  TPatchProgramInput,
  TPatchSessionInput,
  TProgramBlockRow,
  TProgramRow,
  TProgramSessionRow,
  TEnrollProgramInput,
  TUnenrollProgramInput,
  TAthleteProgramRow,
} from "./dto";
import { programsRepository } from "./repository";

function requireNonEmpty(val: string | undefined, msg: string) {
  if (!val || !val.trim()) throw new AppError.Validation(msg);
}

function requirePositiveInt(val: number | null | undefined, msg: string) {
  if (val == null) return;
  if (!Number.isInteger(val) || val < 0) throw new AppError.Validation(msg);
}

export interface ProgramsService {
  enroll(input: TEnrollProgramInput): Promise<TAthleteProgramRow>;
  unenroll(input: TUnenrollProgramInput): Promise<void>;

  list(input: TListProgramsInput): Promise<TProgramRow[]>;
  getById(input: TGetProgramInput): Promise<TProgramRow>;
  create(input: TCreateProgramInput): Promise<TProgramRow>;
  update(input: TPatchProgramInput): Promise<TProgramRow>;
  delete(input: TDeleteProgramInput): Promise<void>;

  listBlocks(input: TListBlocksInput): Promise<TProgramBlockRow[]>;
  createBlock(input: TCreateBlockInput): Promise<TProgramBlockRow>;
  updateBlock(input: TPatchBlockInput): Promise<TProgramBlockRow>;
  deleteBlock(input: TDeleteBlockInput): Promise<void>;

  listSessions(input: TListSessionsInput): Promise<TProgramSessionRow[]>;
  createSession(input: TCreateSessionInput): Promise<TProgramSessionRow>;
  updateSession(input: TPatchSessionInput): Promise<TProgramSessionRow>;
  deleteSession(input: TDeleteSessionInput): Promise<void>;
}

export function makeProgramsService(): ProgramsService {
  return {
    async enroll(input) {
      if (input.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
        throw new AppError.Validation("startDate must be YYYY-MM-DD");
      }
      return programsRepository.enroll(input);
    },

    async unenroll(input) {
      return programsRepository.unenroll(input);
    },

    async list(input) {
      const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
      const offset = Math.max(input.offset ?? 0, 0);
      return programsRepository.list({
        ...input,
        limit,
        offset,
        orderBy: input.orderBy ?? "name",
        order: input.order ?? "asc",
      });
    },

    async getById(input) {
      const row = await programsRepository.getById(input);
      if (!row) throw new AppError.NotFound("Program not found");
      return row;
    },

    async create(input) {
      requireNonEmpty(input.name, "Program name is required");
      if (input.totalWeeks != null)
        requirePositiveInt(
          input.totalWeeks,
          "totalWeeks must be a non-negative integer"
        );
      return programsRepository.create({
        ...input,
        description: input.description ?? null,
        goal: input.goal ?? null,
        totalWeeks: input.totalWeeks ?? null,
      });
    },

    async update(input) {
      if ("name" in input && input.name !== undefined)
        requireNonEmpty(input.name, "Program name cannot be empty");
      if ("totalWeeks" in input)
        requirePositiveInt(
          input.totalWeeks ?? null,
          "totalWeeks must be a non-negative integer"
        );
      return programsRepository.update(input);
    },

    async delete(input) {
      return programsRepository.delete(input);
    },

    async listBlocks(input) {
      return programsRepository.listBlocks(input);
    },

    async createBlock(input) {
      requirePositiveInt(
        input.blockIndex,
        "blockIndex must be a non-negative integer"
      );
      return programsRepository.createBlock({
        ...input,
        blockName: input.blockName ?? null,
        focus: input.focus ?? null,
        weekStart: input.weekStart ?? null,
        weekEnd: input.weekEnd ?? null,
      });
    },

    async updateBlock(input) {
      if ("blockIndex" in input && input.blockIndex !== undefined)
        requirePositiveInt(
          input.blockIndex,
          "blockIndex must be a non-negative integer"
        );
      return programsRepository.updateBlock(input);
    },

    async deleteBlock(input) {
      return programsRepository.deleteBlock(input);
    },

    async listSessions(input) {
      return programsRepository.listSessions(input);
    },

    async createSession(input) {
      requirePositiveInt(
        input.dayOffset,
        "dayOffset must be a non-negative integer"
      );
      return programsRepository.createSession({
        ...input,
        title: input.title ?? null,
        notes: input.notes ?? null,
        plannedSessionId: input.plannedSessionId ?? null,
      });
    },

    async updateSession(input) {
      if ("dayOffset" in input && input.dayOffset !== undefined)
        requirePositiveInt(
          input.dayOffset,
          "dayOffset must be a non-negative integer"
        );
      return programsRepository.updateSession(input);
    },

    async deleteSession(input) {
      return programsRepository.deleteSession(input);
    },
  };
}

export const programsService = makeProgramsService();
