// features/lookups/repository.ts
import { and, eq, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  entityKind,
  sessionStatus,
  measurementType,
  workoutType,
  type entityKind as EntityKindTbl,
  type sessionStatus as SessionStatusTbl,
  type measurementType as MeasurementTypeTbl,
  type workoutType as WorkoutTypeTbl,
} from "@/infrastructure/db/schema";
import type {
  TEntityKindRow,
  TListEntityKindsInput,
  TCreateEntityKindInput,
  TUpdateEntityKindInput,
  TDeleteEntityKindInput,
  TCodeLabelRow,
  TUpsertCodeLabelInput,
  TDeleteCodeInput,
} from "./dto";

/* --------------------------------- API ---------------------------------- */
export interface LookupsRepository {
  // Entity kinds (org-scoped)
  listEntityKinds(input: TListEntityKindsInput): Promise<TEntityKindRow[]>;
  createEntityKind(input: TCreateEntityKindInput): Promise<TEntityKindRow>;
  updateEntityKind(input: TUpdateEntityKindInput): Promise<TEntityKindRow>;
  deleteEntityKind(input: TDeleteEntityKindInput): Promise<void>;

  // Global code/label tables
  listSessionStatuses(): Promise<TSessionStatusRow[]>;
  upsertSessionStatus(input: TUpsertCodeLabelInput): Promise<TSessionStatusRow>;
  deleteSessionStatus(input: TDeleteCodeInput): Promise<void>;

  listMeasurementTypes(): Promise<TMeasurementTypeRow[]>;
  upsertMeasurementType(
    input: TUpsertCodeLabelInput
  ): Promise<TMeasurementTypeRow>;
  deleteMeasurementType(input: TDeleteCodeInput): Promise<void>;

  listWorkoutTypes(): Promise<TWorkoutTypeRow[]>;
  upsertWorkoutType(input: TUpsertCodeLabelInput): Promise<TWorkoutTypeRow>;
  deleteWorkoutType(input: TDeleteCodeInput): Promise<void>;
}

/* Type aliases for interface */
export type TSessionStatusRow = TCodeLabelRow;
export type TMeasurementTypeRow = TCodeLabelRow;
export type TWorkoutTypeRow = TCodeLabelRow;

/* ------------------------------- Factory -------------------------------- */
// ⬇️ NOTE: no explicit PostgresJsDatabase type here; let it infer NodePgDatabase
export function makeLookupsRepository(
  database = defaultDatabase
): LookupsRepository {
  return {
    /* ------------------------- Entity Kind (org) ------------------------- */
    async listEntityKinds({ orgId, activeOnly }) {
      const rows = await database
        .select()
        .from(entityKind)
        .where(
          activeOnly
            ? and(eq(entityKind.orgId, orgId), eq(entityKind.isActive, true))
            : eq(entityKind.orgId, orgId)
        )
        .orderBy(entityKind.code);

      return rows.map(mapEntityKindRow);
    },

    async createEntityKind({ orgId, code, description, isActive }) {
      const [row] = await database
        .insert(entityKind)
        .values({
          orgId,
          code,
          description: description ?? null,
          isActive: isActive ?? true,
        })
        .returning();
      return mapEntityKindRow(row);
    },

    async updateEntityKind({ code, patch }) {
      const [row] = await database
        .update(entityKind)
        .set({
          ...(patch.description !== undefined && {
            description: patch.description ?? null,
          }),
          ...(patch.isActive !== undefined && { isActive: patch.isActive }),
          updatedAt: sql`now()`,
        })
        .where(eq(entityKind.code, code))
        .returning();
      return mapEntityKindRow(row!);
    },

    async deleteEntityKind({ code }) {
      await database.delete(entityKind).where(eq(entityKind.code, code));
    },

    /* ---------------------- Session Status (global) ---------------------- */
    async listSessionStatuses() {
      const rows = await database
        .select()
        .from(sessionStatus)
        .orderBy(sessionStatus.code);
      return rows.map(mapCodeLabelRow);
    },

    async upsertSessionStatus({ code, label }) {
      const updated = await database
        .update(sessionStatus)
        .set({ label })
        .where(eq(sessionStatus.code, code))
        .returning();

      if (updated.length) return mapCodeLabelRow(updated[0]);

      const [inserted] = await database
        .insert(sessionStatus)
        .values({ code, label })
        .returning();

      return mapCodeLabelRow(inserted);
    },

    async deleteSessionStatus({ code }) {
      await database.delete(sessionStatus).where(eq(sessionStatus.code, code));
    },

    /* -------------------- Measurement Type (global) --------------------- */
    async listMeasurementTypes() {
      const rows = await database
        .select()
        .from(measurementType)
        .orderBy(measurementType.code);
      return rows.map(mapCodeLabelRow);
    },

    async upsertMeasurementType({ code, label }) {
      const updated = await database
        .update(measurementType)
        .set({ label })
        .where(eq(measurementType.code, code))
        .returning();

      if (updated.length) return mapCodeLabelRow(updated[0]);

      const [inserted] = await database
        .insert(measurementType)
        .values({ code, label })
        .returning();

      return mapCodeLabelRow(inserted);
    },

    async deleteMeasurementType({ code }) {
      await database
        .delete(measurementType)
        .where(eq(measurementType.code, code));
    },

    /* ------------------------ Workout Type (global) ---------------------- */
    async listWorkoutTypes() {
      const rows = await database
        .select()
        .from(workoutType)
        .orderBy(workoutType.code);
      return rows.map(mapCodeLabelRow);
    },

    async upsertWorkoutType({ code, label }) {
      const updated = await database
        .update(workoutType)
        .set({ label })
        .where(eq(workoutType.code, code))
        .returning();

      if (updated.length) return mapCodeLabelRow(updated[0]);

      const [inserted] = await database
        .insert(workoutType)
        .values({ code, label })
        .returning();

      return mapCodeLabelRow(inserted);
    },

    async deleteWorkoutType({ code }) {
      await database.delete(workoutType).where(eq(workoutType.code, code));
    },
  };
}

/* -------------------------------- Mappers ------------------------------- */
function mapEntityKindRow(
  r: typeof EntityKindTbl.$inferSelect
): TEntityKindRow {
  return {
    code: r.code,
    orgId: r.orgId,
    description: r.description ?? null,
    isActive: r.isActive,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

function mapCodeLabelRow<
  T extends
    | typeof SessionStatusTbl.$inferSelect
    | typeof MeasurementTypeTbl.$inferSelect
    | typeof WorkoutTypeTbl.$inferSelect,
>(r: T): TCodeLabelRow {
  return { code: (r as any).code, label: (r as any).label };
}

export const lookupsRepository = makeLookupsRepository();
