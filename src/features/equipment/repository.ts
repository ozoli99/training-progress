import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  equipment,
  type equipment as EquipmentTbl,
} from "@/infrastructure/db/schema";
import type { TEquipmentRow } from "./dto";

export interface EquipmentRepository {
  list(input: {
    orgId: string;
    q?: string;
    includeInactive?: boolean;
  }): Promise<TEquipmentRow[]>;

  get(input: {
    orgId: string;
    equipmentId: string;
  }): Promise<TEquipmentRow | null>;

  create(input: {
    orgId: string;
    name: string;
    variant?: string | null;
    specs?: Record<string, unknown>;
    isActive?: boolean;
  }): Promise<TEquipmentRow>;

  update(input: {
    orgId: string;
    equipmentId: string;
    name?: string;
    variant?: string | null;
    specs?: Record<string, unknown>;
    isActive?: boolean;
  }): Promise<TEquipmentRow>;

  delete(input: { orgId: string; equipmentId: string }): Promise<void>;
}

export function makeEquipmentRepository(
  database = defaultDatabase
): EquipmentRepository {
  return {
    async list({ orgId, q, includeInactive }) {
      const where = and(
        eq(equipment.orgId, orgId),
        includeInactive ? sql`true` : eq(equipment.isActive, true),
        q
          ? or(
              ilike(equipment.name, `%${q}%`),
              ilike(equipment.variant, `%${q}%`)
            )
          : sql`true`
      );

      const rows = await database
        .select()
        .from(equipment)
        .where(where)
        .orderBy(equipment.createdAt);

      return rows.map(mapRow);
    },

    async get({ orgId, equipmentId }) {
      const [row] = await database
        .select()
        .from(equipment)
        .where(and(eq(equipment.orgId, orgId), eq(equipment.id, equipmentId)))
        .limit(1);

      return row ? mapRow(row) : null;
    },

    async create({ orgId, name, variant, specs, isActive }) {
      const [created] = await database
        .insert(equipment)
        .values({
          orgId,
          name,
          variant: variant ?? null,
          specs: (specs as any) ?? null,
          isActive: isActive ?? true,
        })
        .returning();

      return mapRow(created!);
    },

    async update({ orgId, equipmentId, name, variant, specs, isActive }) {
      const [updated] = await database
        .update(equipment)
        .set({
          name: name === undefined ? sql`${equipment.name}` : name,
          variant:
            variant === undefined
              ? sql`${equipment.variant}`
              : (variant as any),
          specs: specs === undefined ? sql`${equipment.specs}` : (specs as any),
          isActive:
            isActive === undefined ? sql`${equipment.isActive}` : !!isActive,
          updatedAt: sql`now()`,
        })
        .where(and(eq(equipment.orgId, orgId), eq(equipment.id, equipmentId)))
        .returning();

      return mapRow(updated!);
    },

    async delete({ orgId, equipmentId }) {
      await database
        .delete(equipment)
        .where(and(eq(equipment.orgId, orgId), eq(equipment.id, equipmentId)));
    },
  };
}

function mapRow(r: typeof EquipmentTbl.$inferSelect): TEquipmentRow {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    variant: r.variant ?? null,
    specs: (r.specs as any) ?? null,
    isActive: !!r.isActive,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

export const equipmentRepository = makeEquipmentRepository();
