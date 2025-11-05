import { and, eq, ilike, or } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  trainingLocation,
  trainingLocationEquipment,
} from "@/infrastructure/db/schema";

export type LocationRow = InferSelectModel<typeof trainingLocation>;
export type NewLocationRow = InferInsertModel<typeof trainingLocation>;
export type TleRow = InferSelectModel<typeof trainingLocationEquipment>;
export type NewTleRow = InferInsertModel<typeof trainingLocationEquipment>;

export async function insertLocation(values: NewLocationRow) {
  const [row] = await db.insert(trainingLocation).values(values).returning();
  return row!;
}

export async function getLocationById(locationId: string) {
  const rows = await db
    .select()
    .from(trainingLocation)
    .where(eq(trainingLocation.id, locationId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLocationByOrgName(orgId: string, name: string) {
  const rows = await db
    .select()
    .from(trainingLocation)
    .where(
      and(eq(trainingLocation.orgId, orgId), eq(trainingLocation.name, name))
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function updateLocationById(
  locationId: string,
  patch: Partial<LocationRow>
) {
  const [row] = await db
    .update(trainingLocation)
    .set(patch as any)
    .where(eq(trainingLocation.id, locationId))
    .returning();
  return row ?? null;
}

export async function deleteLocationById(locationId: string) {
  await db.delete(trainingLocation).where(eq(trainingLocation.id, locationId));
}

export async function listLocations(opts: {
  orgId: string;
  limit: number;
  offset: number;
  q?: string;
  isActive?: boolean;
}) {
  const filters = [
    eq(trainingLocation.orgId, opts.orgId),
    typeof opts.isActive === "boolean"
      ? eq(trainingLocation.isActive, opts.isActive)
      : undefined,
    opts.q ? ilike(trainingLocation.name, `%${opts.q}%`) : undefined,
  ].filter(Boolean) as any[];

  return db
    .select()
    .from(trainingLocation)
    .where(and(...filters))
    .orderBy(trainingLocation.name)
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function insertLocationEquipment(values: NewTleRow) {
  const [row] = await db
    .insert(trainingLocationEquipment)
    .values(values)
    .returning();
  return row!;
}

export async function getLocationEquipmentById(tleId: string) {
  const rows = await db
    .select()
    .from(trainingLocationEquipment)
    .where(eq(trainingLocationEquipment.id, tleId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listLocationEquipment(opts: {
  locationId: string;
  limit: number;
  offset: number;
  q?: string;
  isActive?: boolean;
}) {
  const f = [
    eq(trainingLocationEquipment.trainingLocationId, opts.locationId),
    typeof opts.isActive === "boolean"
      ? eq(trainingLocationEquipment.isActive, opts.isActive)
      : undefined,
    opts.q
      ? or(
          ilike(trainingLocationEquipment.name, `%${opts.q}%`),
          ilike(trainingLocationEquipment.variant, `%${opts.q}%`)
        )
      : undefined,
  ].filter(Boolean) as any[];

  return db
    .select()
    .from(trainingLocationEquipment)
    .where(and(...f))
    .orderBy(trainingLocationEquipment.name, trainingLocationEquipment.variant)
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function updateLocationEquipmentById(
  tleId: string,
  patch: Partial<TleRow>
) {
  const [row] = await db
    .update(trainingLocationEquipment)
    .set(patch as any)
    .where(eq(trainingLocationEquipment.id, tleId))
    .returning();
  return row ?? null;
}

export async function deleteLocationEquipmentById(tleId: string) {
  await db
    .delete(trainingLocationEquipment)
    .where(eq(trainingLocationEquipment.id, tleId));
}
