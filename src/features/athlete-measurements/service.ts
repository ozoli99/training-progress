import {
  AthleteMeasurementRow,
  ListAthleteMeasurementsInput,
  GetAthleteMeasurementByIdInput,
  CreateAthleteMeasurementInput,
  UpdateAthleteMeasurementInput,
  DeleteAthleteMeasurementInput,
} from "./dto";
import {
  athleteMeasurementsRepository,
  type AthleteMeasurementsRepository,
} from "./repository";

export function makeAthleteMeasurementsService(
  repository: AthleteMeasurementsRepository
) {
  return {
    async list(input: unknown) {
      const data = ListAthleteMeasurementsInput.parse(input);
      const rows = await repository.list(data);
      return rows.map((r) => AthleteMeasurementRow.parse(r));
    },

    async getById(input: unknown) {
      const data = GetAthleteMeasurementByIdInput.parse(input);
      const row = await repository.getById(data);
      return row ? AthleteMeasurementRow.parse(row) : null;
    },

    async create(input: unknown) {
      const data = CreateAthleteMeasurementInput.parse(input);
      const row = await repository.create(data);
      return AthleteMeasurementRow.parse(row);
    },

    async update(input: unknown) {
      const data = UpdateAthleteMeasurementInput.parse(input);
      const row = await repository.update(data);
      return AthleteMeasurementRow.parse(row);
    },

    async delete(input: unknown) {
      const data = DeleteAthleteMeasurementInput.parse(input);
      await repository.delete(data);
    },
  };
}

export const athleteMeasurementsService = makeAthleteMeasurementsService(
  athleteMeasurementsRepository
);
export type AthleteMeasurementsService = ReturnType<
  typeof makeAthleteMeasurementsService
>;
