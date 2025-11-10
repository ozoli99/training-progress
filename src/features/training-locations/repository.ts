import { and, eq, ilike, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  trainingLocation,
  trainingLocationEquipment,
  type trainingLocation as TrainingLocationTbl,
  type trainingLocationEquipment as TLETbl,
} from "@/infrastructure/db/schema";
import type {
  TTrainingLocationRow,
  TTrainingLocationEquipmentRow,
} from "./dto";

export interface TrainingLocationsRepository {
  list(input: {
    orgId: string;
    q?: string;
    includeInactive?: boolean;
  }): Promise<TTrainingLocationRow[]>;
  get(input: {
    orgId: string;
    locationId: string;
  }): Promise<TTrainingLocationRow | null>;
  create(input: {
    orgId: string;
    name: string;
    type?: string | null;
    address?: string | null;
    isActive?: boolean;
  }): Promise<TTrainingLocationRow>;
  update(input: {
    orgId: string;
    locationId: string;
    name?: string;
    type?: string | null;
    address?: string | null;
    isActive?: boolean;
  }): Promise<TTrainingLocationRow>;
  listEquipment(input: {
    trainingLocationId: string;
    includeInactive?: boolean;
  }): Promise<TTrainingLocationEquipmentRow[]>;
  addEquipment(input: {
    trainingLocationId: string;
    name: string;
    variant?: string | null;
    specs?: Record<string, any>;
    isActive?: boolean;
  }): Promise<TTrainingLocationEquipmentRow>;
  updateEquipment(input: {
    equipmentId: string;
    name?: string;
    variant?: string | null;
    specs?: Record<string, any>;
    isActive?: boolean;
  }): Promise<TTrainingLocationEquipmentRow>;
  removeEquipment(input: { equipmentId: string }): Promise<void>;
}

export function makeTrainingLocationsRepository(
  database = defaultDatabase
): TrainingLocationsRepository {
  return {
    async list({ orgId, q, includeInactive }) {
      const rows = await database
        .select()
        .from(trainingLocation)
        .where(
          and(
            eq(trainingLocation.orgId, orgId),
            q ? ilike(trainingLocation.name, `%${q}%`) : sql`true`,
            includeInactive ? sql`true` : eq(trainingLocation.isActive, true)
          )
        )
        .orderBy(trainingLocation.createdAt);

      return rows.map(mapLocationRow);
    },

    async get({ orgId, locationId }) {
      const [row] = await database
        .select()
        .from(trainingLocation)
        .where(
          and(
            eq(trainingLocation.orgId, orgId),
            eq(trainingLocation.id, locationId)
          )
        )
        .limit(1);
      return row ? mapLocationRow(row) : null;
    },

    async create({ orgId, name, type, address, isActive }) {
      const [created] = await database
        .insert(trainingLocation)
        .values({
          orgId,
          name,
          type: type ?? null,
          address: address ?? null,
          isActive: isActive ?? true,
        })
        .returning();
      return mapLocationRow(created);
    },

    async update({ orgId, locationId, name, type, address, isActive }) {
      const [updated] = await database
        .update(trainingLocation)
        .set({
          name: name === undefined ? sql`${trainingLocation.name}` : name,
          type:
            type === undefined ? sql`${trainingLocation.type}` : (type as any),
          address:
            address === undefined
              ? sql`${trainingLocation.address}`
              : (address as any),
          isActive:
            isActive === undefined
              ? sql`${trainingLocation.isActive}`
              : !!isActive,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(trainingLocation.orgId, orgId),
            eq(trainingLocation.id, locationId)
          )
        )
        .returning();
      return mapLocationRow(updated!);
    },

    async listEquipment({ trainingLocationId, includeInactive }) {
      const rows = await database
        .select()
        .from(trainingLocationEquipment)
        .where(
          and(
            eq(
              trainingLocationEquipment.trainingLocationId,
              trainingLocationId
            ),
            includeInactive
              ? sql`true`
              : eq(trainingLocationEquipment.isActive, true)
          )
        );
      return rows.map(mapTLERow);
    },

    async addEquipment({ trainingLocationId, name, variant, specs, isActive }) {
      const [row] = await database
        .insert(trainingLocationEquipment)
        .values({
          trainingLocationId,
          name,
          variant: variant ?? null,
          specs: (specs ?? null) as any,
          isActive: isActive ?? true,
        })
        .returning();
      return mapTLERow(row!);
    },

    async updateEquipment({ equipmentId, name, variant, specs, isActive }) {
      const [row] = await database
        .update(trainingLocationEquipment)
        .set({
          name:
            name === undefined ? sql`${trainingLocationEquipment.name}` : name,
          variant:
            variant === undefined
              ? sql`${trainingLocationEquipment.variant}`
              : (variant as any),
          specs:
            specs === undefined
              ? sql`${trainingLocationEquipment.specs}`
              : (specs as any),
          isActive:
            isActive === undefined
              ? sql`${trainingLocationEquipment.isActive}`
              : !!isActive,
        })
        .where(eq(trainingLocationEquipment.id, equipmentId))
        .returning();
      return mapTLERow(row!);
    },

    async removeEquipment({ equipmentId }) {
      await database
        .delete(trainingLocationEquipment)
        .where(eq(trainingLocationEquipment.id, equipmentId));
    },
  };
}

function mapLocationRow(
  r: typeof TrainingLocationTbl.$inferSelect
): TTrainingLocationRow {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    type: r.type ?? null,
    address: r.address ?? null,
    isActive: !!r.isActive,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

function mapTLERow(
  r: typeof TLETbl.$inferSelect
): TTrainingLocationEquipmentRow {
  return {
    id: r.id,
    trainingLocationId: r.trainingLocationId,
    name: r.name,
    variant: r.variant ?? null,
    specs: (r as any).specs ?? null,
    isActive: !!r.isActive,
  };
}

export const trainingLocationsRepository = makeTrainingLocationsRepository();
