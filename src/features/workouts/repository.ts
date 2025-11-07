import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import * as schema from "@/infrastructure/db/schema";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import type {
  TWorkoutRow,
  TWorkoutVersionRow,
  TWorkoutPartVersionRow,
} from "./dto";

const { workout, workoutVersion, workoutPartVersion, exercise } = schema;

export interface WorkoutsRepository {
  ensureWorkoutInOrg(orgId: string, workoutId: string): Promise<boolean>;
  ensureExerciseInOrg(orgId: string, exerciseId: string): Promise<boolean>;

  listWorkouts(input: {
    orgId: string;
    q?: string;
    limit?: number;
    offset?: number;
    order?: "asc" | "desc";
  }): Promise<TWorkoutRow[]>;
  getWorkout(orgId: string, workoutId: string): Promise<TWorkoutRow | null>;
  createWorkout(input: {
    orgId: string;
    name: string;
    type?: string;
  }): Promise<TWorkoutRow>;
  updateWorkout(input: {
    orgId: string;
    workoutId: string;
    patch: Partial<typeof workout.$inferInsert>;
  }): Promise<TWorkoutRow | null>;
  removeWorkout(orgId: string, workoutId: string): Promise<number>;

  createVersion(input: {
    orgId: string;
    workoutId: string;
    createdBy?: string;
    status?: "active" | "archived";
    cloneFromVersionId?: string;
  }): Promise<TWorkoutVersionRow>;
  listVersions(input: {
    orgId: string;
    workoutId: string;
    limit?: number;
    offset?: number;
    order?: "asc" | "desc";
  }): Promise<TWorkoutVersionRow[]>;
  getVersion(input: {
    orgId: string;
    workoutId: string;
    versionId: string;
  }): Promise<TWorkoutVersionRow | null>;

  replaceVersionParts(input: {
    orgId: string;
    workoutId: string;
    versionId: string;
    items: Array<{
      exerciseId: string;
      blockIndex: number;
      prescription?: string;
    }>;
  }): Promise<TWorkoutPartVersionRow[]>;
  listVersionParts(input: {
    orgId: string;
    workoutId: string;
    versionId: string;
  }): Promise<TWorkoutPartVersionRow[]>;
}

export function makeWorkoutsRepository(
  database = defaultDatabase
): WorkoutsRepository {
  return {
    async ensureWorkoutInOrg(orgId, workoutId) {
      const [w] = await database
        .select({ id: workout.id })
        .from(workout)
        .where(and(eq(workout.id, workoutId), eq(workout.orgId, orgId)))
        .limit(1);
      return !!w;
    },

    async ensureExerciseInOrg(orgId, exerciseId) {
      const [e] = await database
        .select({ id: exercise.id })
        .from(exercise)
        .where(and(eq(exercise.id, exerciseId), eq(exercise.orgId, orgId)))
        .limit(1);
      return !!e;
    },

    async listWorkouts({ orgId, q, limit = 50, offset = 0, order = "asc" }) {
      const where = and(
        eq(workout.orgId, orgId),
        q ? ilike(workout.name, `%${q}%`) : undefined
      );
      const orderBy = order === "asc" ? asc(workout.name) : desc(workout.name);

      const rows = await database
        .select()
        .from(workout)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return rows.map(mapWorkoutRow);
    },

    async getWorkout(orgId, workoutId) {
      const [row] = await database
        .select()
        .from(workout)
        .where(and(eq(workout.id, workoutId), eq(workout.orgId, orgId)))
        .limit(1);
      return row ? mapWorkoutRow(row) : null;
    },

    async createWorkout({ orgId, name, type }) {
      const [row] = await database
        .insert(workout)
        .values({
          orgId,
          name,
          type: type ?? null,
        })
        .returning();
      return mapWorkoutRow(row);
    },

    async updateWorkout({ orgId, workoutId, patch }) {
      const [row] = await database
        .update(workout)
        .set({
          ...patch,
          updatedAt: sql`now()`,
        })
        .where(and(eq(workout.id, workoutId), eq(workout.orgId, orgId)))
        .returning();
      return row ? mapWorkoutRow(row) : null;
    },

    async removeWorkout(orgId, workoutId) {
      const res = await database
        .delete(workout)
        .where(and(eq(workout.id, workoutId), eq(workout.orgId, orgId)));
      return res.rowCount ?? 0;
    },

    async createVersion({
      orgId,
      workoutId,
      createdBy,
      status,
      cloneFromVersionId,
    }) {
      const ok = await this.ensureWorkoutInOrg(orgId, workoutId);
      if (!ok) return Promise.reject(new Error("Workout not in org."));

      const [maxRow] = await database
        .select({
          max: sql<number>`coalesce(max(${workoutVersion.versionNumber}), 0)`,
        })
        .from(workoutVersion)
        .where(eq(workoutVersion.workoutId, workoutId));
      const nextVersion = Number(maxRow?.max ?? 0) + 1;

      const [ver] = await database
        .insert(workoutVersion)
        .values({
          workoutId,
          versionNumber: nextVersion,
          status: (status ?? "active") as any,
          createdBy: createdBy ?? null,
        })
        .returning();

      if (cloneFromVersionId) {
        const parts = await database
          .select()
          .from(workoutPartVersion)
          .where(eq(workoutPartVersion.workoutVersionId, cloneFromVersionId));

        if (parts.length > 0) {
          await database.insert(workoutPartVersion).values(
            parts.map((p) => ({
              workoutVersionId: ver.id,
              exerciseId: p.exerciseId,
              blockIndex: p.blockIndex,
              prescription: p.prescription ?? null,
            }))
          );
        }
      }

      return mapWorkoutVersionRow(ver);
    },

    async listVersions({
      orgId,
      workoutId,
      limit = 50,
      offset = 0,
      order = "asc",
    }) {
      const ok = await this.ensureWorkoutInOrg(orgId, workoutId);
      if (!ok) return [];

      const orderBy =
        order === "asc"
          ? asc(workoutVersion.versionNumber)
          : desc(workoutVersion.versionNumber);

      const rows = await database
        .select()
        .from(workoutVersion)
        .where(eq(workoutVersion.workoutId, workoutId))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return rows.map(mapWorkoutVersionRow);
    },

    async getVersion({ orgId, workoutId, versionId }) {
      const ok = await this.ensureWorkoutInOrg(orgId, workoutId);
      if (!ok) return null;

      const [row] = await database
        .select()
        .from(workoutVersion)
        .where(
          and(
            eq(workoutVersion.id, versionId),
            eq(workoutVersion.workoutId, workoutId)
          )
        )
        .limit(1);

      return row ? mapWorkoutVersionRow(row) : null;
    },

    async replaceVersionParts({ orgId, workoutId, versionId, items }) {
      const ok = await this.ensureWorkoutInOrg(orgId, workoutId);
      if (!ok) return Promise.reject(new Error("Workout not in org."));

      await database
        .delete(workoutPartVersion)
        .where(eq(workoutPartVersion.workoutVersionId, versionId));

      if (items.length === 0) return [];

      const rows = await database
        .insert(workoutPartVersion)
        .values(
          items.map((it) => ({
            workoutVersionId: versionId,
            exerciseId: it.exerciseId,
            blockIndex: it.blockIndex ?? 0,
            prescription: it.prescription ?? null,
          }))
        )
        .returning();

      return rows.map(mapWorkoutPartVersionRow);
    },

    async listVersionParts({ orgId, workoutId, versionId }) {
      const ok = await this.ensureWorkoutInOrg(orgId, workoutId);
      if (!ok) return [];

      const rows = await database
        .select()
        .from(workoutPartVersion)
        .where(eq(workoutPartVersion.workoutVersionId, versionId))
        .orderBy(asc(workoutPartVersion.blockIndex));

      return rows.map(mapWorkoutPartVersionRow);
    },
  };
}

function mapWorkoutRow(r: typeof workout.$inferSelect): TWorkoutRow {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    type: r.type ?? null,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

function mapWorkoutVersionRow(
  r: typeof workoutVersion.$inferSelect
): TWorkoutVersionRow {
  return {
    id: r.id,
    workoutId: r.workoutId,
    versionNumber: r.versionNumber,
    status: (r.status as "active" | "archived") ?? "active",
    createdAt: String(r.createdAt),
    createdBy: r.createdBy ?? null,
  };
}

function mapWorkoutPartVersionRow(
  r: typeof workoutPartVersion.$inferSelect
): TWorkoutPartVersionRow {
  return {
    id: r.id,
    workoutVersionId: r.workoutVersionId,
    exerciseId: r.exerciseId,
    blockIndex: r.blockIndex,
    prescription: r.prescription ?? null,
  };
}

export const workoutsRepository = makeWorkoutsRepository();
