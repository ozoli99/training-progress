import { AppError } from "@/shared/errors";
import {
  insertMovementGroup,
  getMovementGroupById,
  getMovementGroupByOrgAndName,
  updateMovementGroupById,
  deleteMovementGroupById,
  listMovementGroups as repoListMovementGroups,
  listExercisesInMovementGroup,
} from "./repository";
import type { CreateMovementGroupInput, UpdateMovementGroupInput } from "./dto";

function toResponse(
  row: NonNullable<Awaited<ReturnType<typeof getMovementGroupById>>>
) {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    description: row.description ?? null,
    isActive: row.isActive,
  };
}

export async function createMovementGroupService(
  orgId: string,
  input: CreateMovementGroupInput
) {
  const clash = await getMovementGroupByOrgAndName(orgId, input.name);
  if (clash)
    throw new AppError.Conflict(
      "Movement group name already exists in this org"
    );

  const row = await insertMovementGroup({
    orgId,
    name: input.name,
    description: input.description,
    isActive: input.isActive ?? true,
  } as any);

  return toResponse(row);
}

export async function fetchMovementGroupService(movementGroupId: string) {
  const row = await getMovementGroupById(movementGroupId);
  if (!row) throw new AppError.NotFound("Movement group not found");
  return toResponse(row);
}

export async function listMovementGroupsService(
  orgId: string,
  params: {
    limit: number;
    offset: number;
    q?: string;
    isActive?: boolean;
  }
) {
  const rows = await repoListMovementGroups({ orgId, ...params });
  return rows.map(toResponse);
}

export async function patchMovementGroupService(
  movementGroupId: string,
  patch: UpdateMovementGroupInput
) {
  const existing = await getMovementGroupById(movementGroupId);
  if (!existing) throw new AppError.NotFound("Movement group not found");

  if (patch.name && patch.name !== existing.name) {
    const clash = await getMovementGroupByOrgAndName(
      existing.orgId,
      patch.name
    );
    if (clash)
      throw new AppError.Conflict(
        "Movement group name already exists in this org"
      );
  }

  const updated = await updateMovementGroupById(movementGroupId, {
    name: patch.name ?? existing.name,
    description:
      patch.description === undefined
        ? existing.description
        : patch.description,
    isActive: patch.isActive ?? existing.isActive,
  } as any);
  if (!updated)
    throw new AppError.NotFound("Movement group not found (after update)");

  return toResponse(updated);
}

export async function removeMovementGroupService(movementGroupId: string) {
  const existing = await getMovementGroupById(movementGroupId);
  if (!existing) throw new AppError.NotFound("Movement group not found");
  await deleteMovementGroupById(movementGroupId);
}

export async function listExercisesInMovementGroupService(
  movementGroupId: string
) {
  return listExercisesInMovementGroup(movementGroupId);
}
