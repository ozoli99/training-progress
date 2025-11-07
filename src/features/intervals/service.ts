import {
  IntervalRow,
  ListIntervalsInput,
  GetIntervalInput,
  CreateIntervalInput,
  UpdateIntervalInput,
  DeleteIntervalInput,
} from "./dto";
import { intervalsRepository, type IntervalsRepository } from "./repository";

export function makeIntervalsService(repository: IntervalsRepository) {
  return {
    async list(input: unknown) {
      const data = ListIntervalsInput.parse(input);
      const rows = await repository.list(data);
      return rows.map((r) => IntervalRow.parse(r));
    },

    async get(input: unknown) {
      const data = GetIntervalInput.parse(input);
      const row = await repository.get(data);
      return row ? IntervalRow.parse(row) : null;
    },

    async create(input: unknown) {
      const data = CreateIntervalInput.parse(input);
      const row = await repository.create(data);
      return IntervalRow.parse(row);
    },

    async update(input: unknown) {
      const data = UpdateIntervalInput.parse(input);
      const row = await repository.update(data);
      return IntervalRow.parse(row);
    },

    async delete(input: unknown) {
      const data = DeleteIntervalInput.parse(input);
      await repository.delete(data);
    },
  };
}

export const intervalsService = makeIntervalsService(intervalsRepository);
export type IntervalsService = ReturnType<typeof makeIntervalsService>;
