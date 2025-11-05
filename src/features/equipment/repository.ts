import { and, eq, ilike, or, isNull } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { equipment } from "@/infrastructure/db/schema";

export type EquipmentRow = InferSelectModel<typeof equipment>;
export type NewEquipmentRow = InferInsertModel<typeof equipment>;

export async function insertEquipment(values: NewEquipmentRow) {
  const [row] = await db.insert(equipment).values(values).returning();
  return row!;
}

export async function getEquipmentById(equipmentId: string) {
  const rows = await db
    .select()
    .from(equipment)
    .where(eq(equipment.id, equipmentId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getEquipmentByOrgNameVariant(
  orgId: string,
  name: string,
  variant?: string | null
) {
  const variantCond =
    variant == null
      ? isNull(equipment.variant)
      : eq(equipment.variant, variant);

  const rows = await db
    .select()
    .from(equipment)
    .where(
      and(eq(equipment.orgId, orgId), eq(equipment.name, name), variantCond)
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function updateEquipmentById(
  equipmentId: string,
  patch: Partial<EquipmentRow>
) {
  const [row] = await db
    .update(equipment)
    .set(patch as any)
    .where(eq(equipment.id, equipmentId))
    .returning();
  return row ?? null;
}

export async function deleteEquipmentById(equipmentId: string) {
  await db.delete(equipment).where(eq(equipment.id, equipmentId));
}

export async function listEquipment(opts: {
  orgId: string;
  limit: number;
  offset: number;
  q?: string;
  isActive?: boolean;
}) {
  const filters = [
    eq(equipment.orgId, opts.orgId),
    typeof opts.isActive === "boolean"
      ? eq(equipment.isActive, opts.isActive)
      : undefined,
    opts.q
      ? or(
          ilike(equipment.name, `%${opts.q}%`),
          ilike(equipment.variant, `%${opts.q}%`)
        )
      : undefined,
  ].filter(Boolean) as any[];

  return db
    .select()
    .from(equipment)
    .where(and(...filters))
    .orderBy(equipment.name, equipment.variant)
    .limit(opts.limit)
    .offset(opts.offset);
}
