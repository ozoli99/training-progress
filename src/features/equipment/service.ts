import { AppError } from "@/shared/errors";
import {
  insertEquipment,
  getEquipmentById,
  getEquipmentByOrgNameVariant,
  updateEquipmentById,
  deleteEquipmentById,
  listEquipment as repoListEquipment,
} from "./repository";
import type { CreateEquipmentInput, UpdateEquipmentInput } from "./dto";

function toResponse(
  row: NonNullable<Awaited<ReturnType<typeof getEquipmentById>>>
) {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    variant: row.variant ?? null,
    specs: (row.specs as any) ?? null,
    isActive: row.isActive,
  };
}

export async function createEquipmentService(
  orgId: string,
  input: CreateEquipmentInput
) {
  const clash = await getEquipmentByOrgNameVariant(
    orgId,
    input.name,
    input.variant ?? null
  );
  if (clash)
    throw new AppError.Conflict(
      "Equipment with this name & variant already exists in this org"
    );

  const row = await insertEquipment({
    orgId,
    name: input.name,
    variant: input.variant ?? null,
    specs: input.specs,
    isActive: input.isActive ?? true,
  } as any);

  return toResponse(row);
}

export async function fetchEquipmentService(equipmentId: string) {
  const row = await getEquipmentById(equipmentId);
  if (!row) throw new AppError.NotFound("Equipment not found");
  return toResponse(row);
}

export async function listEquipmentService(
  orgId: string,
  params: { limit: number; offset: number; q?: string; isActive?: boolean }
) {
  const rows = await repoListEquipment({ orgId, ...params });
  return rows.map(toResponse);
}

export async function patchEquipmentService(
  equipmentId: string,
  patch: UpdateEquipmentInput
) {
  const existing = await getEquipmentById(equipmentId);
  if (!existing) throw new AppError.NotFound("Equipment not found");

  // Unique (orgId, name, variant)
  const nextName = patch.name ?? existing.name;
  const nextVariant = patch.variant ?? existing.variant ?? null;
  if (
    nextName !== existing.name ||
    nextVariant !== (existing.variant ?? null)
  ) {
    const clash = await getEquipmentByOrgNameVariant(
      existing.orgId,
      nextName,
      nextVariant
    );
    if (clash && clash.id !== equipmentId) {
      throw new AppError.Conflict(
        "Equipment with this name & variant already exists in this org"
      );
    }
  }

  const updated = await updateEquipmentById(equipmentId, {
    name: nextName,
    variant: nextVariant,
    specs: patch.specs === undefined ? existing.specs : patch.specs,
    isActive: patch.isActive ?? existing.isActive,
  } as any);

  if (!updated)
    throw new AppError.NotFound("Equipment not found (after update)");
  return toResponse(updated);
}

export async function removeEquipmentService(equipmentId: string) {
  const existing = await getEquipmentById(equipmentId);
  if (!existing) throw new AppError.NotFound("Equipment not found");
  await deleteEquipmentById(equipmentId);
}
