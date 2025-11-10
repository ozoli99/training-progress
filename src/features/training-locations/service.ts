import {
  TrainingLocationRow,
  CreateTrainingLocationInput,
  UpdateTrainingLocationInput,
  ListTrainingLocationsInput,
  GetTrainingLocationInput,
  TrainingLocationEquipmentRow,
  ListLocationEquipmentInput,
  AddLocationEquipmentInput,
  UpdateLocationEquipmentInput,
  RemoveLocationEquipmentInput,
} from "./dto";
import {
  trainingLocationsRepository,
  type TrainingLocationsRepository,
} from "./repository";

export function makeTrainingLocationsService(
  repo: TrainingLocationsRepository
) {
  return {
    async list(input: unknown) {
      const data = ListTrainingLocationsInput.parse(input);
      const rows = await repo.list(data);
      return rows.map((r) => TrainingLocationRow.parse(r));
    },
    async get(input: unknown) {
      const data = GetTrainingLocationInput.parse(input);
      const row = await repo.get(data);
      return row ? TrainingLocationRow.parse(row) : null;
    },
    async create(input: unknown) {
      const data = CreateTrainingLocationInput.parse(input);
      const row = await repo.create(data);
      return TrainingLocationRow.parse(row);
    },
    async update(input: unknown) {
      const data = UpdateTrainingLocationInput.parse(input);
      const row = await repo.update(data);
      return TrainingLocationRow.parse(row);
    },

    async listEquipment(input: unknown) {
      const data = ListLocationEquipmentInput.parse(input);
      const rows = await repo.listEquipment(data);
      return rows.map((r) => TrainingLocationEquipmentRow.parse(r));
    },
    async addEquipment(input: unknown) {
      const data = AddLocationEquipmentInput.parse(input);
      const row = await repo.addEquipment(data);
      return TrainingLocationEquipmentRow.parse(row);
    },
    async updateEquipment(input: unknown) {
      const data = UpdateLocationEquipmentInput.parse(input);
      const row = await repo.updateEquipment(data);
      return TrainingLocationEquipmentRow.parse(row);
    },
    async removeEquipment(input: unknown) {
      const data = RemoveLocationEquipmentInput.parse(input);
      await repo.removeEquipment(data);
    },
  };
}

export const trainingLocationsService = makeTrainingLocationsService(
  trainingLocationsRepository
);
export type TrainingLocationsService = ReturnType<
  typeof makeTrainingLocationsService
>;
