import { AppError } from "@/shared/errors";
import {
  insertLocation,
  getLocationById,
  getLocationByOrgName,
  updateLocationById,
  deleteLocationById,
  listLocations as repoListLocations,
  insertLocationEquipment,
  getLocationEquipmentById,
  listLocationEquipment as repoListLocationEquipment,
  updateLocationEquipmentById,
  deleteLocationEquipmentById,
} from "./repository";
import type {
  CreateLocationInput,
  UpdateLocationInput,
  CreateLocationEquipmentInput,
  UpdateLocationEquipmentInput,
} from "./dto";

const toLocation = (
  r: NonNullable<Awaited<ReturnType<typeof getLocationById>>>
) => ({
  id: r.id,
  orgId: r.orgId,
  name: r.name,
  address: r.address ?? null,
  type: (r.type as "gym" | "home" | "outdoor" | null) ?? null,
  isActive: r.isActive,
});

const toTle = (
  r: NonNullable<Awaited<ReturnType<typeof getLocationEquipmentById>>>
) => ({
  id: r.id,
  trainingLocationId: r.trainingLocationId,
  name: r.name,
  variant: r.variant ?? null,
  specs: (r.specs as any) ?? null,
  isActive: r.isActive,
});

export async function createLocationService(
  orgId: string,
  input: CreateLocationInput
) {
  const clash = await getLocationByOrgName(orgId, input.name);
  if (clash)
    throw new AppError.Conflict(
      "A training location with this name already exists in this org"
    );

  const row = await insertLocation({
    orgId,
    name: input.name,
    address: input.address,
    type: (input.type as any) ?? null,
    isActive: input.isActive ?? true,
  } as any);

  return toLocation(row);
}

export async function fetchLocationService(locationId: string) {
  const row = await getLocationById(locationId);
  if (!row) throw new AppError.NotFound("Training location not found");
  return toLocation(row);
}

export async function listLocationsService(
  orgId: string,
  params: { limit: number; offset: number; q?: string; isActive?: boolean }
) {
  const rows = await repoListLocations({ orgId, ...params });
  return rows.map(toLocation);
}

export async function patchLocationService(
  locationId: string,
  patch: UpdateLocationInput
) {
  const existing = await getLocationById(locationId);
  if (!existing) throw new AppError.NotFound("Training location not found");

  const nextName = patch.name ?? existing.name;
  if (nextName !== existing.name) {
    const clash = await getLocationByOrgName(existing.orgId, nextName);
    if (clash)
      throw new AppError.Conflict(
        "A training location with this name already exists in this org"
      );
  }

  const updated = await updateLocationById(locationId, {
    name: nextName,
    address: patch.address === undefined ? existing.address : patch.address,
    type:
      patch.type === undefined ? (existing.type as any) : (patch.type as any),
    isActive: patch.isActive ?? existing.isActive,
  } as any);

  if (!updated)
    throw new AppError.NotFound("Training location not found (after update)");
  return toLocation(updated);
}

export async function removeLocationService(locationId: string) {
  const existing = await getLocationById(locationId);
  if (!existing) throw new AppError.NotFound("Training location not found");
  await deleteLocationById(locationId);
}

export async function createLocationEquipmentService(
  locationId: string,
  input: CreateLocationEquipmentInput
) {
  const row = await insertLocationEquipment({
    trainingLocationId: locationId,
    name: input.name,
    variant: input.variant ?? null,
    specs: input.specs,
    isActive: input.isActive ?? true,
  } as any);
  return toTle(row);
}

export async function listLocationEquipmentService(
  locationId: string,
  params: { limit: number; offset: number; q?: string; isActive?: boolean }
) {
  const rows = await repoListLocationEquipment({ locationId, ...params });
  return rows.map(toTle);
}

export async function fetchLocationEquipmentService(tleId: string) {
  const row = await getLocationEquipmentById(tleId);
  if (!row) throw new AppError.NotFound("Location equipment not found");
  return toTle(row);
}

export async function patchLocationEquipmentService(
  tleId: string,
  patch: UpdateLocationEquipmentInput
) {
  const existing = await getLocationEquipmentById(tleId);
  if (!existing) throw new AppError.NotFound("Location equipment not found");

  const updated = await updateLocationEquipmentById(tleId, {
    name: patch.name ?? existing.name,
    variant: patch.variant ?? existing.variant,
    specs: patch.specs === undefined ? existing.specs : patch.specs,
    isActive: patch.isActive ?? existing.isActive,
  } as any);

  if (!updated)
    throw new AppError.NotFound("Location equipment not found (after update)");
  return toTle(updated);
}

export async function removeLocationEquipmentService(tleId: string) {
  const existing = await getLocationEquipmentById(tleId);
  if (!existing) throw new AppError.NotFound("Location equipment not found");
  await deleteLocationEquipmentById(tleId);
}
