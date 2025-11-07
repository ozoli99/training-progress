import { z } from "zod";
import {
  ExerciseRow,
  CreateExerciseInput,
  UpdateExerciseInput,
  DeleteExerciseInput,
  ListExercisesInput,
} from "./dto";
import { exercisesRepository, type ExercisesRepository } from "./repository";

const GetInput = z.object({
  orgId: z.string().uuid(),
  exerciseId: z.string().uuid(),
});

export function makeExercisesService(repository: ExercisesRepository) {
  return {
    async list(input: unknown) {
      const data = ListExercisesInput.parse(input);
      const rows = await repository.list(data);
      return rows.map((r) => ExerciseRow.parse(r));
    },

    async get(input: unknown) {
      const data = GetInput.parse(input);
      const row = await repository.get(data);
      return row ? ExerciseRow.parse(row) : null;
    },

    async create(input: unknown) {
      const data = CreateExerciseInput.parse(input);
      const row = await repository.create(data);
      return ExerciseRow.parse(row);
    },

    async update(input: unknown) {
      const data = UpdateExerciseInput.parse(input);
      const row = await repository.update(data);
      return ExerciseRow.parse(row);
    },

    async delete(input: unknown) {
      const data = DeleteExerciseInput.parse(input);
      await repository.delete(data);
    },
  };
}

export const exercisesService = makeExercisesService(exercisesRepository);
export type ExercisesService = ReturnType<typeof makeExercisesService>;
