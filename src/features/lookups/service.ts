// features/lookups/service.ts
import { lookupsRepository, type LookupsRepository } from "./repository";
import {
  EntityKindRow,
  EntityKindsResponse,
  ListEntityKindsInput,
  CreateEntityKindInput,
  UpdateEntityKindInput,
  DeleteEntityKindInput,
  CodeLabelListResponse,
  SessionStatusRow,
  MeasurementTypeRow,
  WorkoutTypeRow,
  UpsertCodeLabelInput,
  DeleteCodeInput,
  CodeLabelRow,
} from "./dto";

export function makeLookupsService(repository: LookupsRepository) {
  return {
    /* ------------------------- Entity kinds (org) ------------------------ */
    async listEntityKinds(input: unknown) {
      const data = ListEntityKindsInput.parse(input);
      const items = await repository.listEntityKinds(data);
      return EntityKindsResponse.parse({ items });
    },

    async createEntityKind(input: unknown) {
      const data = CreateEntityKindInput.parse(input);
      const row = await repository.createEntityKind(data);
      return EntityKindRow.parse(row);
    },

    async updateEntityKind(input: unknown) {
      const data = UpdateEntityKindInput.parse(input);
      const row = await repository.updateEntityKind(data);
      return EntityKindRow.parse(row);
    },

    async deleteEntityKind(input: unknown) {
      const data = DeleteEntityKindInput.parse(input);
      await repository.deleteEntityKind(data);
    },

    /* ---------------------- Session Status (global) ---------------------- */
    async listSessionStatuses() {
      const items = await repository.listSessionStatuses();
      // ensure shape
      return CodeLabelListResponse.parse({
        items: items.map((i) => SessionStatusRow.parse(i)),
      });
    },

    async upsertSessionStatus(input: unknown) {
      const data = UpsertCodeLabelInput.parse(input);
      const row = await repository.upsertSessionStatus(data);
      return CodeLabelRow.parse(row);
    },

    async deleteSessionStatus(input: unknown) {
      const data = DeleteCodeInput.parse(input);
      await repository.deleteSessionStatus(data);
    },

    /* -------------------- Measurement Type (global) --------------------- */
    async listMeasurementTypes() {
      const items = await repository.listMeasurementTypes();
      return CodeLabelListResponse.parse({
        items: items.map((i) => MeasurementTypeRow.parse(i)),
      });
    },

    async upsertMeasurementType(input: unknown) {
      const data = UpsertCodeLabelInput.parse(input);
      const row = await repository.upsertMeasurementType(data);
      return CodeLabelRow.parse(row);
    },

    async deleteMeasurementType(input: unknown) {
      const data = DeleteCodeInput.parse(input);
      await repository.deleteMeasurementType(data);
    },

    /* ------------------------ Workout Type (global) ---------------------- */
    async listWorkoutTypes() {
      const items = await repository.listWorkoutTypes();
      return CodeLabelListResponse.parse({
        items: items.map((i) => WorkoutTypeRow.parse(i)),
      });
    },

    async upsertWorkoutType(input: unknown) {
      const data = UpsertCodeLabelInput.parse(input);
      const row = await repository.upsertWorkoutType(data);
      return CodeLabelRow.parse(row);
    },

    async deleteWorkoutType(input: unknown) {
      const data = DeleteCodeInput.parse(input);
      await repository.deleteWorkoutType(data);
    },
  };
}

export const lookupsService = makeLookupsService(lookupsRepository);
export type LookupsService = ReturnType<typeof makeLookupsService>;
