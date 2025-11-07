import { AppError } from "@/shared/errors";
import {
  ZRouteOrg,
  ZRouteWorkout,
  ZRouteVersion,
  ZListWorkoutsQuery,
  ZCreateWorkoutInput,
  ZUpdateWorkoutInput,
  ZWorkoutRow,
  ZWorkoutVersionRow,
  ZListVersionsQuery,
  ZCreateVersionInput,
  ZReplaceVersionPartsInput,
  ZWorkoutPartVersionRow,
} from "./dto";
import { workoutsRepository, type WorkoutsRepository } from "./repository";

export function makeWorkoutsService(repository: WorkoutsRepository) {
  return {
    async list(input: unknown) {
      const { orgId } = ZRouteOrg.parse(input);
      const query = ZListWorkoutsQuery.parse(input);

      const rows = await repository.listWorkouts({
        orgId,
        q: query.q,
        limit: query.limit,
        offset: query.offset,
        order: query.order,
      });
      return rows.map((r) => ZWorkoutRow.parse(r));
    },

    async get(input: unknown) {
      const { orgId, workoutId } = ZRouteWorkout.parse(input);
      const row = await repository.getWorkout(orgId, workoutId);
      if (!row) throw new AppError.NotFound("Workout not found.");
      return ZWorkoutRow.parse(row);
    },

    async create(input: unknown) {
      const data = ZCreateWorkoutInput.parse(input);
      const row = await repository.createWorkout({
        orgId: data.orgId,
        name: data.name,
        type: data.type,
      });
      return ZWorkoutRow.parse(row);
    },

    async update(input: unknown) {
      const { orgId, workoutId, ...rest } = ZUpdateWorkoutInput.parse(input);

      const patch: Partial<
        Parameters<WorkoutsRepository["updateWorkout"]>[0]["patch"]
      > = {};
      if (rest.name !== undefined) patch.name = rest.name;
      if (rest.type !== undefined) patch.type = rest.type ?? null;

      const updated = await repository.updateWorkout({
        orgId,
        workoutId,
        patch,
      });
      if (!updated) throw new AppError.NotFound("Workout not found.");

      return ZWorkoutRow.parse(updated);
    },

    async delete(input: unknown) {
      const { orgId, workoutId } = ZRouteWorkout.parse(input);
      const n = await repository.removeWorkout(orgId, workoutId);
      if (n === 0) throw new AppError.NotFound("Workout not found.");
      return { ok: true as const };
    },

    async createVersion(input: unknown) {
      const data = ZCreateVersionInput.parse(input);

      const ok = await repository.ensureWorkoutInOrg(
        data.orgId,
        data.workoutId
      );
      if (!ok) throw new AppError.NotFound("Workout not found in org.");

      const ver = await repository.createVersion({
        orgId: data.orgId,
        workoutId: data.workoutId,
        createdBy: data.createdBy,
        status: data.status,
        cloneFromVersionId: data.cloneFromVersionId,
      });

      return ZWorkoutVersionRow.parse(ver);
    },

    async listVersions(input: unknown) {
      const { orgId, workoutId } = ZRouteWorkout.parse(input);
      const query = ZListVersionsQuery.parse(input);

      const rows = await repository.listVersions({
        orgId,
        workoutId,
        limit: query.limit,
        offset: query.offset,
        order: query.order,
      });
      return rows.map((r) => ZWorkoutVersionRow.parse(r));
    },

    async getVersion(input: unknown) {
      const { orgId, workoutId, versionId } = ZRouteVersion.parse(input);
      const row = await repository.getVersion({ orgId, workoutId, versionId });
      if (!row) throw new AppError.NotFound("Workout version not found.");
      return ZWorkoutVersionRow.parse(row);
    },

    async replaceVersionParts(input: unknown) {
      const data = ZReplaceVersionPartsInput.parse(input);

      for (const it of data.items) {
        const exOk = await repository.ensureExerciseInOrg(
          data.orgId,
          it.exerciseId
        );
        if (!exOk) {
          throw new AppError.Validation(
            `exerciseId ${it.exerciseId} does not belong to org.`
          );
        }
      }

      const rows = await repository.replaceVersionParts({
        orgId: data.orgId,
        workoutId: data.workoutId,
        versionId: data.versionId,
        items: data.items,
      });

      return rows.map((r) => ZWorkoutPartVersionRow.parse(r));
    },

    async listVersionParts(input: unknown) {
      const { orgId, workoutId, versionId } = ZRouteVersion.parse(input);

      const rows = await repository.listVersionParts({
        orgId,
        workoutId,
        versionId,
      });
      return rows.map((r) => ZWorkoutPartVersionRow.parse(r));
    },
  };
}

export const workoutsService = makeWorkoutsService(workoutsRepository);
export type WorkoutsService = ReturnType<typeof makeWorkoutsService>;
