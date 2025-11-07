import { z } from "zod";
import {
  AthleteRow,
  AthleteWithRelations,
  CreateAthleteInput,
  UpdateAthleteInput,
  DeleteAthleteInput,
  ListAthletesInput,
  SetAthleteVisibilityInput,
  LinkAthleteLocationInput,
  UnlinkAthleteLocationInput,
  SetDefaultAthleteLocationInput,
  ListAthleteLocationsInput,
} from "./dto";
import { athletesRepository, type AthletesRepository } from "./repository";

export function makeAthletesService(repository: AthletesRepository) {
  return {
    async list(input: unknown) {
      const data = ListAthletesInput.parse(input);
      const rows = await repository.list(data);
      return rows.map((r) => AthleteRow.parse(r));
    },

    async get(input: unknown) {
      const data = z
        .object({ orgId: z.string().uuid(), athleteId: z.string().uuid() })
        .parse(input);
      const row = await repository.get(data);
      if (!row) return null;

      const locations = await repository.listLocations({
        orgId: data.orgId,
        athleteId: data.athleteId,
      });

      return AthleteWithRelations.parse({
        ...row,
        locations,
      });
    },

    async create(input: unknown) {
      const data = CreateAthleteInput.parse(input);
      const row = await repository.create(data);
      return AthleteRow.parse(row);
    },

    async update(input: unknown) {
      const data = UpdateAthleteInput.parse(input);
      const row = await repository.update(data);
      return AthleteRow.parse(row);
    },

    async delete(input: unknown) {
      const data = DeleteAthleteInput.parse(input);
      await repository.delete(data);
    },

    async listLocations(input: unknown) {
      const data = ListAthleteLocationsInput.parse(input);
      return repository.listLocations(data);
    },

    async linkLocation(input: unknown) {
      const data = LinkAthleteLocationInput.parse(input);
      await repository.linkLocation(data);
    },

    async unlinkLocation(input: unknown) {
      const data = UnlinkAthleteLocationInput.parse(input);
      await repository.unlinkLocation(data);
    },

    async setDefaultLocation(input: unknown) {
      const data = SetDefaultAthleteLocationInput.parse(input);
      await repository.setDefaultLocation(data);
    },

    async setVisibility(input: unknown) {
      const data = SetAthleteVisibilityInput.parse(input);
      return repository.upsertVisibility(data);
    },

    async listVisibility(input: unknown) {
      const data = z
        .object({ orgId: z.string().uuid(), athleteId: z.string().uuid() })
        .parse(input);
      return repository.listVisibility(data);
    },
  };
}

export const athletesService = makeAthletesService(athletesRepository);
export type AthletesService = ReturnType<typeof makeAthletesService>;
