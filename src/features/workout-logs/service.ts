import { AppError } from "@/shared/errors";
import {
  ZRouteOrg,
  ZRouteSession,
  ZRouteWorkoutLog,
  ZListLogsQuery,
  ZCreateWorkoutLogInput,
  ZUpdateWorkoutLogInput,
  ZWorkoutLogRow,
  ZWorkoutLogEntryRow,
  ZWorkoutRoundRow,
  ZListEntriesQuery,
  ZListRoundsQuery,
  ZReplaceEntriesInput,
  ZReplaceRoundsInput,
} from "./dto";
import { makeWorkoutLogsRepository } from "./repository";
import type { WorkoutLogsRepository } from "./repository";

export function makeWorkoutLogsService(repository: WorkoutLogsRepository) {
  return {
    async list(input: unknown) {
      const { orgId, sessionId } = ZRouteSession.parse(input);
      const query = ZListLogsQuery.parse(input);
      const rows = await repository.listLogs({
        orgId,
        sessionId,
        limit: query.limit,
        offset: query.offset,
        order: query.order,
      });
      return rows.map((r) => ZWorkoutLogRow.parse(r));
    },

    async get(input: unknown) {
      const { orgId, sessionId, workoutLogId } = ZRouteWorkoutLog.parse(input);
      const row = await repository.getLog({ orgId, sessionId, workoutLogId });
      if (!row) throw new AppError.NotFound("Workout log not found.");
      return ZWorkoutLogRow.parse(row);
    },

    async create(input: unknown) {
      const data = ZCreateWorkoutLogInput.parse(input);
      const row = await repository.createLog({
        orgId: data.orgId,
        sessionId: data.sessionId,
        sessionBlockId: data.sessionBlockId,
        workoutId: data.workoutId,
        plannedWorkoutId: data.plannedWorkoutId,
        workoutVersionId: data.workoutVersionId,
        resultRaw: data.resultRaw,
        resultPrimary: data.resultPrimary,
        asRx: data.asRx,
        isDraft: data.isDraft,
      });
      return ZWorkoutLogRow.parse(row);
    },

    async update(input: unknown) {
      const { orgId, sessionId, workoutLogId, ...rest } =
        ZUpdateWorkoutLogInput.parse(input);

      const patch: Partial<
        Parameters<WorkoutLogsRepository["updateLog"]>[0]["patch"]
      > = {};
      if (rest.sessionBlockId !== undefined)
        patch.sessionBlockId = rest.sessionBlockId;
      if (rest.plannedWorkoutId !== undefined)
        patch.plannedWorkoutId = rest.plannedWorkoutId;
      if (rest.workoutVersionId !== undefined)
        patch.workoutVersionId = rest.workoutVersionId;
      if (rest.resultRaw !== undefined) patch.resultRaw = rest.resultRaw;
      if (rest.resultPrimary !== undefined)
        patch.resultPrimary =
          rest.resultPrimary === null ? null : String(rest.resultPrimary);
      if (rest.asRx !== undefined) patch.asRx = rest.asRx;
      if (rest.isDraft !== undefined) patch.isDraft = rest.isDraft;

      const updated = await repository.updateLog({
        orgId,
        sessionId,
        workoutLogId,
        patch,
      });
      if (!updated) throw new AppError.NotFound("Workout log not found.");
      return ZWorkoutLogRow.parse(updated);
    },

    async delete(input: unknown) {
      const { orgId, sessionId, workoutLogId } = ZRouteWorkoutLog.parse(input);
      const n = await repository.deleteLog({ orgId, sessionId, workoutLogId });
      if (n === 0) throw new AppError.NotFound("Workout log not found.");
      return { ok: true as const };
    },

    async listEntries(input: unknown) {
      const { orgId, workoutLogId } = ZRouteWorkoutLog.parse(input);
      const _q = ZListEntriesQuery.parse(input);
      const rows = await repository.listEntries({
        orgId,
        workoutLogId,
        order: _q.order,
      });
      return rows.map((r) => ZWorkoutLogEntryRow.parse(r));
    },

    async replaceEntries(input: unknown) {
      const data = ZReplaceEntriesInput.parse(input);
      const rows = await repository.replaceEntries({
        orgId: data.orgId,
        workoutLogId: data.workoutLogId,
        items: data.items,
      });
      return rows.map((r) => ZWorkoutLogEntryRow.parse(r));
    },

    async listRounds(input: unknown) {
      const { orgId, workoutLogId } = ZRouteWorkoutLog.parse(input);
      const _q = ZListRoundsQuery.parse(input);
      const rows = await repository.listRounds({
        orgId,
        workoutLogId,
        order: _q.order,
      });
      return rows.map((r) => ZWorkoutRoundRow.parse(r));
    },

    async replaceRounds(input: unknown) {
      const data = ZReplaceRoundsInput.parse(input);
      const { rounds } = await repository.replaceRounds({
        orgId: data.orgId,
        workoutLogId: data.workoutLogId,
        items: data.items,
      });
      return rounds.map((r) => ZWorkoutRoundRow.parse(r));
    },
  };
}

export const workoutLogsRepository = makeWorkoutLogsRepository();
export const workoutLogsService = makeWorkoutLogsService(workoutLogsRepository);
export type WorkoutLogsService = ReturnType<typeof makeWorkoutLogsService>;
