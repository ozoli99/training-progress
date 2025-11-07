import { AppError } from "@/shared/errors";
import {
  setLogsRepository,
  type SetLogsRepository,
  type SetLogInsert,
} from "./repository";
import {
  ZRouteParams,
  ZListQuery,
  ZSetLogCreate,
  ZSetLogUpdate,
  ZSetLogRow,
  type SetLogGetInput,
  type SetLogCreateInput,
  type SetLogUpdateInput,
  type SetLogDeleteInput,
} from "./dto";

const dec = (v?: number | null) =>
  v === undefined ? undefined : v === null ? null : String(v);

export function makeSetLogsService(repository: SetLogsRepository) {
  return {
    async list(input: unknown) {
      const params = ZRouteParams.pick({
        orgId: true,
        athleteId: true,
        sessionId: true,
      }).parse(input);
      const query = ZListQuery.parse(input);

      const ok = await repository.ensureSessionScope(
        params.orgId,
        params.athleteId,
        params.sessionId
      );
      if (!ok)
        throw new AppError.NotFound("Session not found for athlete/org.");

      const rows = await repository.list({
        sessionId: params.sessionId,
        ...query,
      });
      return rows.map((r) => ZSetLogRow.parse(r));
    },

    async get(input: unknown) {
      const { orgId, athleteId, sessionId, setLogId } = ZRouteParams.extend({
        setLogId: ZRouteParams.shape.setLogId.unwrap(),
      }).parse(input) as SetLogGetInput;

      const ok = await repository.ensureSessionScope(
        orgId,
        athleteId,
        sessionId
      );
      if (!ok)
        throw new AppError.NotFound("Session not found for athlete/org.");

      const row = await repository.get(sessionId, setLogId);
      if (!row) throw new AppError.NotFound("Set log not found.");

      return ZSetLogRow.parse(row);
    },

    async create(input: unknown) {
      const { orgId, athleteId, sessionId, ...body } = ZRouteParams.merge(
        ZSetLogCreate
      ).parse(input) as SetLogCreateInput;

      const ok = await repository.ensureSessionScope(
        orgId,
        athleteId,
        sessionId
      );
      if (!ok)
        throw new AppError.NotFound("Session not found for athlete/org.");

      if (body.sessionBlockId) {
        const blockOk = await repository.ensureBlockBelongsToSession(
          sessionId,
          body.sessionBlockId
        );
        if (!blockOk)
          throw new AppError.BadRequest(
            "sessionBlockId does not belong to the session."
          );
      }

      const exerciseOk = await repository.ensureExerciseInOrg(
        orgId,
        body.exerciseId
      );
      if (!exerciseOk)
        throw new AppError.BadRequest("exerciseId does not belong to the org.");

      try {
        const created = await repository.create({
          sessionId,
          sessionBlockId: body.sessionBlockId ?? null,
          exerciseId: body.exerciseId,
          plannedSetId: body.plannedSetId ?? null,
          setIndex: body.setIndex ?? 0,
          reps: body.reps ?? null,
          loadKg: dec(body.loadKg) ?? null,
          durationS: dec(body.durationS) ?? null,
          distanceM: dec(body.distanceM) ?? null,
          rpe: dec(body.rpe) ?? null,
          toFailure:
            typeof body.toFailure === "boolean" ? body.toFailure : null,
        });
        return ZSetLogRow.parse(created);
      } catch (e: unknown) {
        throw AppError.fromUnknown(e, "Failed to create set log.");
      }
    },

    async update(input: unknown) {
      const parsed = ZRouteParams.extend({
        setLogId: ZRouteParams.shape.setLogId.unwrap(),
      })
        .merge(ZSetLogUpdate)
        .parse(input) as SetLogUpdateInput;

      const {
        orgId,
        athleteId,
        sessionId,
        setLogId,
        sessionBlockId,
        exerciseId,
        plannedSetId,
        setIndex,
        reps,
        loadKg,
        durationS,
        distanceM,
        rpe,
        toFailure,
      } = parsed;

      const ok = await repository.ensureSessionScope(
        orgId,
        athleteId,
        sessionId
      );
      if (!ok)
        throw new AppError.NotFound("Session not found for athlete/org.");

      if (sessionBlockId) {
        const blockOk = await repository.ensureBlockBelongsToSession(
          sessionId,
          sessionBlockId
        );
        if (!blockOk)
          throw new AppError.BadRequest(
            "sessionBlockId does not belong to the session."
          );
      }

      if (exerciseId) {
        const exerciseOk = await repository.ensureExerciseInOrg(
          orgId,
          exerciseId
        );
        if (!exerciseOk)
          throw new AppError.BadRequest(
            "exerciseId does not belong to the org."
          );
      }

      const patch: Partial<SetLogInsert> = {};
      if (sessionBlockId !== undefined)
        patch.sessionBlockId = sessionBlockId ?? null;
      if (exerciseId !== undefined) patch.exerciseId = exerciseId;
      if (plannedSetId !== undefined) patch.plannedSetId = plannedSetId ?? null;
      if (setIndex !== undefined) patch.setIndex = setIndex;
      if (reps !== undefined) patch.reps = reps ?? null;
      if (loadKg !== undefined) patch.loadKg = dec(loadKg) ?? null;
      if (durationS !== undefined) patch.durationS = dec(durationS) ?? null;
      if (distanceM !== undefined) patch.distanceM = dec(distanceM) ?? null;
      if (rpe !== undefined) patch.rpe = dec(rpe) ?? null;
      if (toFailure !== undefined) patch.toFailure = toFailure;

      const updated = await repository.update(sessionId, setLogId, patch);
      if (!updated) throw new AppError.NotFound("Set log not found.");

      return ZSetLogRow.parse(updated);
    },

    async delete(input: unknown) {
      const { orgId, athleteId, sessionId, setLogId } = ZRouteParams.extend({
        setLogId: ZRouteParams.shape.setLogId.unwrap(),
      }).parse(input) as SetLogDeleteInput;

      const ok = await repository.ensureSessionScope(
        orgId,
        athleteId,
        sessionId
      );
      if (!ok)
        throw new AppError.NotFound("Session not found for athlete/org.");

      const n = await repository.remove(sessionId, setLogId);
      if (n === 0) throw new AppError.NotFound("Set log not found.");

      return { ok: true as const };
    },
  };
}

export const setLogsService = makeSetLogsService(setLogsRepository);
export type SetLogsService = ReturnType<typeof makeSetLogsService>;
