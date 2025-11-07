import { and, eq, ilike, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  globalExercise,
  globalExerciseMedia,
  type globalExercise as GlobalExerciseTbl,
  type globalExerciseMedia as GlobalExerciseMediaTbl,
} from "@/infrastructure/db/schema";
import type { TGlobalExerciseRow, TGlobalExerciseMediaRow } from "./dto";

export interface GlobalExercisesRepository {
  list(input: {
    search?: string;
    category?: string;
    modality?: string;
    isActive?: boolean;
    limit: number;
    offset: number;
  }): Promise<TGlobalExerciseRow[]>;

  get(input: { id: string }): Promise<TGlobalExerciseRow | null>;

  create(input: {
    name: string;
    category?: string;
    modality?: string;
    description?: string;
    standards?: unknown;
    isPublic?: boolean;
    isActive?: boolean;
  }): Promise<TGlobalExerciseRow>;

  update(input: {
    id: string;
    name?: string;
    category?: string | null;
    modality?: string | null;
    description?: string | null;
    standards?: unknown | null;
    isPublic?: boolean;
    isActive?: boolean;
  }): Promise<TGlobalExerciseRow>;

  delete(input: { id: string }): Promise<void>;

  listMedia(input: {
    globalExerciseId: string;
  }): Promise<TGlobalExerciseMediaRow[]>;
  createMedia(input: {
    globalExerciseId: string;
    mediaType: string;
    url: string;
    title?: string;
    displayOrder?: number;
  }): Promise<TGlobalExerciseMediaRow>;
  updateMedia(input: {
    id: string;
    title?: string | null;
    displayOrder?: number;
  }): Promise<TGlobalExerciseMediaRow>;
  deleteMedia(input: { id: string }): Promise<void>;
}

export function makeGlobalExercisesRepository(
  database = defaultDatabase
): GlobalExercisesRepository {
  return {
    async list({ search, category, modality, isActive, limit, offset }) {
      const where = and(
        search ? ilike(globalExercise.name, `%${search}%`) : sql`true`,
        category ? eq(globalExercise.category, category) : sql`true`,
        modality ? eq(globalExercise.modality, modality) : sql`true`,
        isActive === undefined
          ? sql`true`
          : eq(globalExercise.isActive, isActive)
      );

      const rows = await database
        .select()
        .from(globalExercise)
        .where(where)
        .orderBy(globalExercise.name)
        .limit(limit)
        .offset(offset);

      return rows.map(mapGlobalExerciseRow);
    },

    async get({ id }) {
      const [row] = await database
        .select()
        .from(globalExercise)
        .where(eq(globalExercise.id, id))
        .limit(1);
      return row ? mapGlobalExerciseRow(row) : null;
    },

    async create({
      name,
      category,
      modality,
      description,
      standards,
      isPublic,
      isActive,
    }) {
      const [created] = await database
        .insert(globalExercise)
        .values({
          name,
          category: category ?? null,
          modality: modality ?? null,
          description: description ?? null,
          standards: standards === undefined ? undefined : (standards as any),
          isPublic: isPublic ?? true,
          isActive: isActive ?? true,
        })
        .returning();
      return mapGlobalExerciseRow(created);
    },

    async update({
      id,
      name,
      category,
      modality,
      description,
      standards,
      isPublic,
      isActive,
    }) {
      const [updated] = await database
        .update(globalExercise)
        .set({
          name: name === undefined ? sql`${globalExercise.name}` : name,
          category:
            category === undefined
              ? sql`${globalExercise.category}`
              : (category as any),
          modality:
            modality === undefined
              ? sql`${globalExercise.modality}`
              : (modality as any),
          description:
            description === undefined
              ? sql`${globalExercise.description}`
              : (description as any),
          standards:
            standards === undefined
              ? sql`${globalExercise.standards}`
              : (standards as any),
          isPublic:
            isPublic === undefined ? sql`${globalExercise.isPublic}` : isPublic,
          isActive:
            isActive === undefined ? sql`${globalExercise.isActive}` : isActive,
          updatedAt: sql`now()`,
        })
        .where(eq(globalExercise.id, id))
        .returning();

      return mapGlobalExerciseRow(updated!);
    },

    async delete({ id }) {
      await database.delete(globalExercise).where(eq(globalExercise.id, id));
    },

    async listMedia({ globalExerciseId }) {
      const rows = await database
        .select()
        .from(globalExerciseMedia)
        .where(eq(globalExerciseMedia.globalExerciseId, globalExerciseId))
        .orderBy(globalExerciseMedia.displayOrder);
      return rows.map(mapGlobalExerciseMediaRow);
    },

    async createMedia({
      globalExerciseId,
      mediaType,
      url,
      title,
      displayOrder,
    }) {
      const [created] = await database
        .insert(globalExerciseMedia)
        .values({
          globalExerciseId,
          mediaType,
          url,
          title: title ?? null,
          displayOrder: displayOrder ?? 0,
        })
        .returning();
      return mapGlobalExerciseMediaRow(created);
    },

    async updateMedia({ id, title, displayOrder }) {
      const [updated] = await database
        .update(globalExerciseMedia)
        .set({
          title:
            title === undefined
              ? sql`${globalExerciseMedia.title}`
              : (title as any),
          displayOrder:
            displayOrder === undefined
              ? sql`${globalExerciseMedia.displayOrder}`
              : displayOrder,
        })
        .where(eq(globalExerciseMedia.id, id))
        .returning();
      return mapGlobalExerciseMediaRow(updated!);
    },

    async deleteMedia({ id }) {
      await database
        .delete(globalExerciseMedia)
        .where(eq(globalExerciseMedia.id, id));
    },
  };
}

function mapGlobalExerciseRow(
  r: typeof GlobalExerciseTbl.$inferSelect
): TGlobalExerciseRow {
  return {
    id: r.id,
    name: r.name,
    category: r.category ?? null,
    modality: r.modality ?? null,
    description: r.description ?? null,
    standards: (r.standards as unknown) ?? null,
    isPublic: !!r.isPublic,
    isActive: !!r.isActive,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

function mapGlobalExerciseMediaRow(
  r: typeof GlobalExerciseMediaTbl.$inferSelect
): TGlobalExerciseMediaRow {
  return {
    id: r.id,
    globalExerciseId: r.globalExerciseId,
    mediaType: r.mediaType,
    url: r.url,
    title: r.title ?? null,
    displayOrder: r.displayOrder ?? 0,
    createdAt: String(r.createdAt),
  };
}

export const globalExercisesRepository = makeGlobalExercisesRepository();
