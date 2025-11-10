import {
  AthleteProfileRow,
  AthleteProfileMetricRow,
  ListAthleteProfilesInput,
  GetAthleteProfileByIdInput,
  GetAthleteProfileByDayInput,
  UpsertAthleteProfileInput,
  UpdateAthleteProfileInput,
  DeleteAthleteProfileInput,
  ListProfileMetricsInput,
  SetProfileMetricInput,
} from "./dto";
import {
  athleteProfilesRepository,
  type AthleteProfilesRepository,
} from "./repository";

export function makeAthleteProfilesService(
  repository: AthleteProfilesRepository
) {
  return {
    async list(input: unknown) {
      const data = ListAthleteProfilesInput.parse(input);
      const rows = await repository.list(data);
      return rows.map((r) => AthleteProfileRow.parse(r));
    },

    async getById(input: unknown) {
      const data = GetAthleteProfileByIdInput.parse(input);
      const row = await repository.getById(data);
      return row ? AthleteProfileRow.parse(row) : null;
    },

    async getByDay(input: unknown) {
      const data = GetAthleteProfileByDayInput.parse(input);
      const row = await repository.getByDay(data);
      return row ? AthleteProfileRow.parse(row) : null;
    },

    async upsert(input: unknown) {
      const data = UpsertAthleteProfileInput.parse(input);
      const row = await repository.upsert(data);
      return AthleteProfileRow.parse(row);
    },

    async update(input: unknown) {
      const data = UpdateAthleteProfileInput.parse(input);
      const row = await repository.update(data);
      return AthleteProfileRow.parse(row);
    },

    async delete(input: unknown) {
      const data = DeleteAthleteProfileInput.parse(input);
      await repository.delete(data);
    },

    async listMetrics(input: unknown) {
      const data = ListProfileMetricsInput.parse(input);
      const rows = await repository.listMetrics(data);
      return rows.map((r) => AthleteProfileMetricRow.parse(r));
    },

    async setMetric(input: unknown) {
      const data = SetProfileMetricInput.parse(input);
      const row = await repository.setMetric(data);
      return AthleteProfileMetricRow.parse(row);
    },
  };
}

export const athleteProfilesService = makeAthleteProfilesService(
  athleteProfilesRepository
);
export type AthleteProfilesService = ReturnType<
  typeof makeAthleteProfilesService
>;
