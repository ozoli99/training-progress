import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  athleteMeasurement,
  type athleteMeasurement as AthleteMeasurementTbl,
} from "@/infrastructure/db/schema";
import type { TAthleteMeasurementRow } from "./dto";

const toNumericDB = (n: number | null | undefined) =>
  n === undefined ? undefined : n === null ? null : String(n);

const toDate = (iso?: string) =>
  iso === undefined ? undefined : new Date(iso);

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapRow(
  r: typeof AthleteMeasurementTbl.$inferSelect
): TAthleteMeasurementRow {
  return {
    id: r.id,
    orgId: r.orgId,
    athleteId: r.athleteId,
    measuredAt: r.measuredAt.toISOString?.() ?? String(r.measuredAt),
    type: r.type,
    valueNum: toNumberOrNull(r.valueNum),
    valueJson: (r.valueJson as unknown) ?? null,
    source: (r.source as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
  };
}

export interface AthleteMeasurementsRepository {
  list(input: {
    orgId: string;
    athleteId: string;
    from?: string; // ISO datetime
    to?: string; // ISO datetime
    types?: string[];
    limit: number;
    offset: number;
    order: "asc" | "desc";
  }): Promise<TAthleteMeasurementRow[]>;

  getById(input: {
    orgId: string;
    athleteMeasurementId: string;
  }): Promise<TAthleteMeasurementRow | null>;

  create(input: {
    orgId: string;
    athleteId: string;
    measuredAt: string; // ISO datetime
    type: string;
    valueNum?: number | null;
    valueJson?: unknown | null;
    source?: string | null;
    notes?: string | null;
  }): Promise<TAthleteMeasurementRow>;

  update(input: {
    orgId: string;
    athleteMeasurementId: string;
    measuredAt?: string; // ISO datetime
    type?: string;
    valueNum?: number | null;
    valueJson?: unknown | null;
    source?: string | null;
    notes?: string | null;
  }): Promise<TAthleteMeasurementRow>;

  delete(input: { orgId: string; athleteMeasurementId: string }): Promise<void>;
}

export function makeAthleteMeasurementsRepository(
  database = defaultDatabase
): AthleteMeasurementsRepository {
  return {
    async list({ orgId, athleteId, from, to, types, limit, offset, order }) {
      const fromDt = toDate(from);
      const toDt = toDate(to);

      const filters = [
        eq(athleteMeasurement.orgId, orgId),
        eq(athleteMeasurement.athleteId, athleteId),
        fromDt ? gte(athleteMeasurement.measuredAt, fromDt) : sql`true`,
        toDt ? lte(athleteMeasurement.measuredAt, toDt) : sql`true`,
        types && types.length
          ? inArray(athleteMeasurement.type, types)
          : sql`true`,
      ] as const;

      const rows = await database
        .select()
        .from(athleteMeasurement)
        .where(and(...filters))
        .orderBy(
          order === "asc"
            ? asc(athleteMeasurement.measuredAt)
            : desc(athleteMeasurement.measuredAt)
        )
        .limit(limit)
        .offset(offset);

      return rows.map(mapRow);
    },

    async getById({ orgId, athleteMeasurementId }) {
      const [row] = await database
        .select()
        .from(athleteMeasurement)
        .where(
          and(
            eq(athleteMeasurement.orgId, orgId),
            eq(athleteMeasurement.id, athleteMeasurementId)
          )
        )
        .limit(1);

      return row ? mapRow(row) : null;
    },

    async create({
      orgId,
      athleteId,
      measuredAt,
      type,
      valueNum,
      valueJson,
      source,
      notes,
    }) {
      const [row] = await database
        .insert(athleteMeasurement)
        .values({
          orgId,
          athleteId,
          measuredAt: new Date(measuredAt), // <-- must be Date for timestamptz
          type,
          valueNum: toNumericDB(valueNum),
          valueJson: valueJson ?? null,
          source: source ?? null,
          notes: notes ?? null,
        })
        .returning();

      return mapRow(row!);
    },

    async update({
      orgId,
      athleteMeasurementId,
      measuredAt,
      type,
      valueNum,
      valueJson,
      source,
      notes,
    }) {
      const patch: Record<string, unknown> = {
        measuredAt:
          measuredAt === undefined
            ? sql`${athleteMeasurement.measuredAt}`
            : new Date(measuredAt), // <-- Date
        type: type === undefined ? sql`${athleteMeasurement.type}` : type,
        valueNum:
          valueNum === undefined
            ? sql`${athleteMeasurement.valueNum}`
            : toNumericDB(valueNum),
        valueJson:
          valueJson === undefined
            ? sql`${athleteMeasurement.valueJson}`
            : (valueJson as unknown),
        source:
          source === undefined ? sql`${athleteMeasurement.source}` : source,
        notes: notes === undefined ? sql`${athleteMeasurement.notes}` : notes,
      };

      const [row] = await database
        .update(athleteMeasurement)
        .set(patch)
        .where(
          and(
            eq(athleteMeasurement.orgId, orgId),
            eq(athleteMeasurement.id, athleteMeasurementId)
          )
        )
        .returning();

      return mapRow(row!);
    },

    async delete({ orgId, athleteMeasurementId }) {
      await database
        .delete(athleteMeasurement)
        .where(
          and(
            eq(athleteMeasurement.orgId, orgId),
            eq(athleteMeasurement.id, athleteMeasurementId)
          )
        );
    },
  };
}

export const athleteMeasurementsRepository =
  makeAthleteMeasurementsRepository();
