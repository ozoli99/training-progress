import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  athleteMeasurement,
  measurementType,
} from "@/infrastructure/db/schema";

type ListArgs = {
  orgId: string;
  athleteId: string;
  limit: number;
  offset: number;
  type?: string;
  fromIso?: string;
  toIso?: string;
  order: "asc" | "desc";
};

export async function repoListMeasurements(args: ListArgs) {
  const { orgId, athleteId, limit, offset, type, fromIso, toIso, order } = args;

  const where = and(
    eq(athleteMeasurement.orgId, orgId),
    eq(athleteMeasurement.athleteId, athleteId),
    type ? eq(athleteMeasurement.type, type) : undefined,
    fromIso ? gte(athleteMeasurement.measuredAt, new Date(fromIso)) : undefined,
    toIso ? lte(athleteMeasurement.measuredAt, new Date(toIso)) : undefined
  );

  const rows = await db
    .select()
    .from(athleteMeasurement)
    .where(where)
    .orderBy(
      order === "asc"
        ? asc(athleteMeasurement.measuredAt)
        : desc(athleteMeasurement.measuredAt)
    )
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function repoGetMeasurementById(id: string) {
  const [row] = await db
    .select()
    .from(athleteMeasurement)
    .where(eq(athleteMeasurement.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoInsertMeasurement(input: {
  orgId: string;
  athleteId: string;
  measuredAt: string; // ISO
  type: string;
  valueNum?: number; // incoming as number
  valueJson?: Record<string, unknown>;
  source?: string;
  notes?: string;
}) {
  const [row] = await db
    .insert(athleteMeasurement)
    .values({
      orgId: input.orgId,
      athleteId: input.athleteId,
      measuredAt: new Date(input.measuredAt),
      type: input.type,
      // numeric() -> string | null in TS
      valueNum:
        input.valueNum !== undefined && input.valueNum !== null
          ? String(input.valueNum)
          : null,
      valueJson: input.valueJson ?? null,
      source: input.source ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdateMeasurementById(
  id: string,
  patch: {
    measuredAt?: string;
    type?: string;
    valueNum?: number | null; // incoming as number|null
    valueJson?: Record<string, unknown> | null;
    source?: string | null;
    notes?: string | null;
  }
) {
  const [row] = await db
    .update(athleteMeasurement)
    .set({
      measuredAt: patch.measuredAt ? new Date(patch.measuredAt) : undefined,
      type: patch.type ?? undefined,
      valueNum:
        patch.valueNum === undefined
          ? undefined
          : patch.valueNum === null
            ? null
            : String(patch.valueNum),
      valueJson: patch.valueJson === undefined ? undefined : patch.valueJson,
      source: patch.source === undefined ? undefined : patch.source,
      notes: patch.notes === undefined ? undefined : patch.notes,
      updatedAt: new Date(),
    })
    .where(eq(athleteMeasurement.id, id))
    .returning();
  return row ?? null;
}

export async function repoDeleteMeasurementById(id: string) {
  await db.delete(athleteMeasurement).where(eq(athleteMeasurement.id, id));
}

export async function repoMeasurementTypeExists(code: string) {
  const [row] = await db
    .select({ code: measurementType.code })
    .from(measurementType)
    .where(eq(measurementType.code, code))
    .limit(1);
  return !!row;
}
