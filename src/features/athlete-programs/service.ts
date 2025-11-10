import { AppError } from "@/shared/errors";
import type {
  TAthleteProgramRow,
  TListAthleteProgramsInput,
  TGetAthleteProgramInput,
  TEnrollAthleteProgramInput,
  TUnenrollAthleteProgramInput,
  TPatchAthleteProgramInput,
} from "./dto";
import { athleteProgramsRepository } from "./repository";

function requireYyyyMmDd(val: string | undefined, msg: string) {
  if (!val) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    throw new AppError.Validation(msg);
  }
}

function requireNonNegativeInt(
  n: number | undefined,
  msg: string
): asserts n is number {
  if (n == null) return;
  if (!Number.isInteger(n) || n < 0) throw new AppError.Validation(msg);
}

export interface AthleteProgramsService {
  list(input: TListAthleteProgramsInput): Promise<TAthleteProgramRow[]>;
  getById(input: TGetAthleteProgramInput): Promise<TAthleteProgramRow>;
  enroll(input: TEnrollAthleteProgramInput): Promise<TAthleteProgramRow>;
  unenroll(input: TUnenrollAthleteProgramInput): Promise<void>;
  patch(input: TPatchAthleteProgramInput): Promise<TAthleteProgramRow>;
}

export function makeAthleteProgramsService(): AthleteProgramsService {
  return {
    async list(input) {
      const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
      const offset = Math.max(input.offset ?? 0, 0);
      return athleteProgramsRepository.list({
        ...input,
        limit,
        offset,
        orderBy: input.orderBy ?? "startDate",
        order: input.order ?? "desc",
      });
    },

    async getById(input) {
      const row = await athleteProgramsRepository.getById(input);
      if (!row) throw new AppError.NotFound("Athlete program not found");
      return row;
    },

    async enroll(input) {
      requireYyyyMmDd(input.startDate, "startDate must be YYYY-MM-DD");
      return athleteProgramsRepository.enroll(input);
    },

    async unenroll(input) {
      await athleteProgramsRepository.unenroll(input);
    },

    async patch(input) {
      requireYyyyMmDd(input.startDate, "startDate must be YYYY-MM-DD");
      requireNonNegativeInt(
        input.currentWeek,
        "currentWeek must be a non-negative integer"
      );
      const row = await athleteProgramsRepository.patch(input);
      if (!row) throw new AppError.NotFound("Athlete program not found");
      return row;
    },
  };
}

export const athleteProgramsService = makeAthleteProgramsService();
