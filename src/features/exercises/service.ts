import { AppError } from "@/shared/errors";
import {
  insertExercise,
  getExerciseById,
  getExerciseByOrgAndName,
  listExercises as repoListExercises,
  updateExerciseById,
  deleteExerciseById,
  listExerciseMovementGroups,
  addExerciseMovementGroup,
  removeExerciseMovementGroup,
} from "./repository";
import type { CreateExerciseInput, UpdateExerciseInput } from "./dto";

const toIso = (d: any) =>
  typeof d === "string" ? d : (d?.toISOString?.() ?? new Date(d).toISOString());

function toExerciseResponse(
  row: NonNullable<Awaited<ReturnType<typeof getExerciseById>>>
) {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    category: row.category ?? null,
    modality: row.modality ?? null,
    globalExerciseId: row.globalExerciseId ?? null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export async function createExerciseService(
  orgId: string,
  input: CreateExerciseInput
) {
  const clash = await getExerciseByOrgAndName(orgId, input.name);
  if (clash)
    throw new AppError.Conflict(
      "Exercise with this name already exists in the org"
    );

  const row = await insertExercise({
    orgId,
    name: input.name,
    category: input.category,
    modality: input.modality,
    globalExerciseId: input.globalExerciseId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  return toExerciseResponse(row);
}

export async function fetchExerciseService(exerciseId: string) {
  const row = await getExerciseById(exerciseId);
  if (!row) throw new AppError.NotFound("Exercise not found");
  return toExerciseResponse(row);
}

export async function listExercisesService(
  orgId: string,
  params: {
    limit: number;
    offset: number;
    q?: string;
    category?: string;
    modality?: string;
  }
) {
  const rows = await repoListExercises({ orgId, ...params });
  return rows.map(toExerciseResponse);
}

export async function patchExerciseService(
  exerciseId: string,
  patch: UpdateExerciseInput
) {
  const existing = await getExerciseById(exerciseId);
  if (!existing) throw new AppError.NotFound("Exercise not found");

  if (patch.name && patch.name !== existing.name) {
    const clash = await getExerciseByOrgAndName(existing.orgId, patch.name);
    if (clash)
      throw new AppError.Conflict(
        "Exercise with this name already exists in the org"
      );
  }

  const updated = await updateExerciseById(exerciseId, {
    name: patch.name ?? existing.name,
    category: patch.category ?? existing.category,
    modality: patch.modality ?? existing.modality,
    globalExerciseId:
      patch.globalExerciseId === undefined
        ? existing.globalExerciseId
        : patch.globalExerciseId,
  } as any);
  if (!updated) throw new AppError.NotFound("Exercise not found");

  return toExerciseResponse(updated);
}

export async function removeExerciseService(exerciseId: string) {
  const existing = await getExerciseById(exerciseId);
  if (!existing) throw new AppError.NotFound("Exercise not found");
  await deleteExerciseById(exerciseId);
}

export async function listExerciseMovementGroupsService(exerciseId: string) {
  return await listExerciseMovementGroups(exerciseId);
}

export async function addExerciseMovementGroupService(
  exerciseId: string,
  movementGroupId: string
) {
  await addExerciseMovementGroup(exerciseId, movementGroupId);
  return await listExerciseMovementGroups(exerciseId);
}

export async function removeExerciseMovementGroupService(
  exerciseId: string,
  movementGroupId: string
) {
  await removeExerciseMovementGroup(exerciseId, movementGroupId);
}
