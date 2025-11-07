import { and, eq, ilike, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  exercise,
  type exercise as ExerciseTbl,
} from "@/infrastructure/db/schema";
import type { TExerciseRow } from "./dto";

export interface ExercisesRepository {
  list(input: {
    orgId: string;
    search?: string;
    category?: string;
    modality?: string;
    limit: number;
    offset: number;
  }): Promise<TExerciseRow[]>;

  get(input: {
    orgId: string;
    exerciseId: string;
  }): Promise<TExerciseRow | null>;

  create(input: {
    orgId: string;
    name: string;
    category?: string;
    modality?: string;
    globalExerciseId?: string;
  }): Promise<TExerciseRow>;

  update(input: {
    orgId: string;
    exerciseId: string;
    name?: string;
    category?: string | null;
    modality?: string | null;
    globalExerciseId?: string | null;
  }): Promise<TExerciseRow>;

  delete(input: { orgId: string; exerciseId: string }): Promise<void>;
}

export function makeExercisesRepository(
  database = defaultDatabase
): ExercisesRepository {
  return {
    async list({ orgId, search, category, modality, limit, offset }) {
      const where = and(
        eq(exercise.orgId, orgId),
        search ? ilike(exercise.name, `%${search}%`) : sql`true`,
        category ? eq(exercise.category, category) : sql`true`,
        modality ? eq(exercise.modality, modality) : sql`true`
      );

      const rows = await database
        .select()
        .from(exercise)
        .where(where)
        .orderBy(exercise.name)
        .limit(limit)
        .offset(offset);

      return rows.map(mapExerciseRow);
    },

    async get({ orgId, exerciseId }) {
      const [row] = await database
        .select()
        .from(exercise)
        .where(and(eq(exercise.orgId, orgId), eq(exercise.id, exerciseId)))
        .limit(1);
      return row ? mapExerciseRow(row) : null;
    },

    async create({ orgId, name, category, modality, globalExerciseId }) {
      const [created] = await database
        .insert(exercise)
        .values({
          orgId,
          name,
          category: category ?? null,
          modality: modality ?? null,
          globalExerciseId: globalExerciseId ?? null,
        })
        .returning();
      return mapExerciseRow(created);
    },

    async update({
      orgId,
      exerciseId,
      name,
      category,
      modality,
      globalExerciseId,
    }) {
      const [updated] = await database
        .update(exercise)
        .set({
          name: name === undefined ? sql`${exercise.name}` : name,
          category:
            category === undefined
              ? sql`${exercise.category}`
              : (category as any),
          modality:
            modality === undefined
              ? sql`${exercise.modality}`
              : (modality as any),
          globalExerciseId:
            globalExerciseId === undefined
              ? sql`${exercise.globalExerciseId}`
              : (globalExerciseId as any),
          updatedAt: sql`now()`,
        })
        .where(and(eq(exercise.orgId, orgId), eq(exercise.id, exerciseId)))
        .returning();
      return mapExerciseRow(updated!);
    },

    async delete({ orgId, exerciseId }) {
      await database
        .delete(exercise)
        .where(and(eq(exercise.orgId, orgId), eq(exercise.id, exerciseId)));
    },
  };
}

function mapExerciseRow(r: typeof ExerciseTbl.$inferSelect): TExerciseRow {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    category: r.category ?? null,
    modality: r.modality ?? null,
    globalExerciseId: r.globalExerciseId ?? null,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

export const exercisesRepository = makeExercisesRepository();
