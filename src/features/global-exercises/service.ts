import {
  GlobalExerciseRow,
  ListGlobalExercisesInput,
  GetGlobalExerciseInput,
  CreateGlobalExerciseInput,
  UpdateGlobalExerciseInput,
  DeleteGlobalExerciseInput,
  GlobalExerciseMediaRow,
  ListGlobalExerciseMediaInput,
  CreateGlobalExerciseMediaInput,
  UpdateGlobalExerciseMediaInput,
  DeleteGlobalExerciseMediaInput,
} from "./dto";
import {
  globalExercisesRepository,
  type GlobalExercisesRepository,
} from "./repository";

export function makeGlobalExercisesService(
  repository: GlobalExercisesRepository
) {
  return {
    async list(input: unknown) {
      const data = ListGlobalExercisesInput.parse(input);
      const rows = await repository.list(data);
      return rows.map((r) => GlobalExerciseRow.parse(r));
    },

    async get(input: unknown) {
      const data = GetGlobalExerciseInput.parse(input);
      const row = await repository.get(data);
      return row ? GlobalExerciseRow.parse(row) : null;
    },

    async create(input: unknown) {
      const data = CreateGlobalExerciseInput.parse(input);
      const row = await repository.create(data);
      return GlobalExerciseRow.parse(row);
    },

    async update(input: unknown) {
      const data = UpdateGlobalExerciseInput.parse(input);
      const row = await repository.update(data);
      return GlobalExerciseRow.parse(row);
    },

    async delete(input: unknown) {
      const data = DeleteGlobalExerciseInput.parse(input);
      await repository.delete(data);
    },

    async listMedia(input: unknown) {
      const data = ListGlobalExerciseMediaInput.parse(input);
      const items = await repository.listMedia(data);
      return items.map((m) => GlobalExerciseMediaRow.parse(m));
    },

    async createMedia(input: unknown) {
      const data = CreateGlobalExerciseMediaInput.parse(input);
      const row = await repository.createMedia(data);
      return GlobalExerciseMediaRow.parse(row);
    },

    async updateMedia(input: unknown) {
      const data = UpdateGlobalExerciseMediaInput.parse(input);
      const row = await repository.updateMedia(data);
      return GlobalExerciseMediaRow.parse(row);
    },

    async deleteMedia(input: unknown) {
      const data = DeleteGlobalExerciseMediaInput.parse(input);
      await repository.deleteMedia(data);
    },
  };
}

export const globalExercisesService = makeGlobalExercisesService(
  globalExercisesRepository
);
export type GlobalExercisesService = ReturnType<
  typeof makeGlobalExercisesService
>;
