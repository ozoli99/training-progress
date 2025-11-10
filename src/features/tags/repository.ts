import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  tag as TagTbl,
  type tag as TagTblType,
} from "@/infrastructure/db/schema";
import type {
  TTagRow,
  TCreateTagInput,
  TPatchTagInput,
  TListTagsInput,
} from "./dto";

function mapRow(r: typeof TagTblType.$inferSelect): TTagRow {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    kind: r.kind,
    isActive: r.isActive,
  };
}

export interface TagsRepository {
  list(input: TListTagsInput): Promise<TTagRow[]>;
  getById(input: { orgId: string; tagId: string }): Promise<TTagRow | null>;
  create(input: TCreateTagInput): Promise<TTagRow>;
  update(input: TPatchTagInput): Promise<TTagRow>;
  delete(input: { orgId: string; tagId: string }): Promise<void>;
}

export function makeTagsRepository(database = defaultDatabase): TagsRepository {
  return {
    async list({
      orgId,
      kind,
      q,
      isActive,
      limit = 50,
      offset = 0,
      orderBy = "name",
      order = "asc",
    }) {
      const filters = [
        eq(TagTbl.orgId, orgId),
        kind ? eq(TagTbl.kind, kind) : sql`true`,
        typeof isActive === "boolean"
          ? eq(TagTbl.isActive, isActive)
          : sql`true`,
        q ? sql`${TagTbl.name} ILIKE ${"%" + q + "%"}` : sql`true`,
      ] as const;

      const orderCol = orderBy === "createdAt" ? TagTbl.createdAt : TagTbl.name;

      const rows = await database
        .select()
        .from(TagTbl)
        .where(and(...filters))
        .orderBy(order === "asc" ? asc(orderCol) : desc(orderCol))
        .limit(limit)
        .offset(offset);

      return rows.map(mapRow);
    },

    async getById({ orgId, tagId }) {
      const [row] = await database
        .select()
        .from(TagTbl)
        .where(and(eq(TagTbl.orgId, orgId), eq(TagTbl.id, tagId)))
        .limit(1);

      return row ? mapRow(row) : null;
    },

    async create({ orgId, name, kind, isActive }) {
      const [row] = await database
        .insert(TagTbl)
        .values({
          orgId,
          name,
          kind,
          isActive: isActive ?? true,
        })
        .returning();

      return mapRow(row!);
    },

    async update({ orgId, tagId, name, kind, isActive }) {
      const patch: Record<string, unknown> = {
        name: name === undefined ? sql`${TagTbl.name}` : name,
        kind: kind === undefined ? sql`${TagTbl.kind}` : kind,
        isActive:
          isActive === undefined ? sql`${TagTbl.isActive}` : Boolean(isActive),
      };

      const [row] = await database
        .update(TagTbl)
        .set(patch)
        .where(and(eq(TagTbl.orgId, orgId), eq(TagTbl.id, tagId)))
        .returning();

      return mapRow(row!);
    },

    async delete({ orgId, tagId }) {
      await database
        .delete(TagTbl)
        .where(and(eq(TagTbl.orgId, orgId), eq(TagTbl.id, tagId)));
    },
  };
}

export const tagsRepository = makeTagsRepository();
