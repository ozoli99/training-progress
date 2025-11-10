import { and, eq, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  coachNote,
  type coachNote as CoachNoteTbl,
} from "@/infrastructure/db/schema";
import type { TCoachNoteRow } from "./dto";

export interface CoachNotesRepository {
  create(input: {
    orgId: string;
    authorUserId: string;
    entityType: string;
    entityId: string;
    content: string;
    isPrivate?: boolean;
    visibility?: "org" | "private" | "public";
  }): Promise<TCoachNoteRow>;

  list(input: {
    orgId: string;
    entityType?: string;
    entityId?: string;
    authorUserId?: string;
    visibility?: "org" | "private" | "public";
    isPrivate?: boolean;
  }): Promise<TCoachNoteRow[]>;

  getById(id: string): Promise<TCoachNoteRow | null>;

  update(input: {
    id: string;
    content?: string;
    isPrivate?: boolean;
    visibility?: "org" | "private" | "public";
  }): Promise<TCoachNoteRow>;

  delete(id: string): Promise<void>;
}

export function makeCoachNotesRepository(
  database = defaultDatabase
): CoachNotesRepository {
  return {
    async create({
      orgId,
      authorUserId,
      entityType,
      entityId,
      content,
      isPrivate,
      visibility,
    }) {
      const [row] = await database
        .insert(coachNote)
        .values({
          orgId,
          authorUserId,
          entityType,
          entityId,
          content,
          isPrivate: isPrivate ?? false,
          visibility: visibility ?? "org",
        })
        .returning();

      return mapRow(row);
    },

    async list({
      orgId,
      entityType,
      entityId,
      authorUserId,
      visibility,
      isPrivate,
    }) {
      const where = and(
        eq(coachNote.orgId, orgId),
        entityType ? eq(coachNote.entityType, entityType) : sql`true`,
        entityId ? eq(coachNote.entityId, entityId) : sql`true`,
        authorUserId ? eq(coachNote.authorUserId, authorUserId) : sql`true`,
        visibility ? eq(coachNote.visibility, visibility) : sql`true`,
        typeof isPrivate === "boolean"
          ? eq(coachNote.isPrivate, isPrivate)
          : sql`true`
      );

      const rows = await database
        .select()
        .from(coachNote)
        .where(where)
        .orderBy(coachNote.createdAt);

      return rows.map(mapRow);
    },

    async getById(id) {
      const [row] = await database
        .select()
        .from(coachNote)
        .where(eq(coachNote.id, id))
        .limit(1);

      return row ? mapRow(row) : null;
    },

    async update({ id, content, isPrivate, visibility }) {
      const [row] = await database
        .update(coachNote)
        .set({
          content: content === undefined ? sql`${coachNote.content}` : content,
          isPrivate:
            isPrivate === undefined ? sql`${coachNote.isPrivate}` : isPrivate,
          visibility:
            visibility === undefined
              ? sql`${coachNote.visibility}`
              : visibility,
        })
        .where(eq(coachNote.id, id))
        .returning();

      return mapRow(row!);
    },

    async delete(id) {
      await database.delete(coachNote).where(eq(coachNote.id, id));
    },
  };
}

function mapRow(r: typeof CoachNoteTbl.$inferSelect): TCoachNoteRow {
  return {
    id: r.id,
    orgId: r.orgId,
    authorUserId: r.authorUserId,
    entityType: r.entityType,
    entityId: r.entityId,
    isPrivate: !!r.isPrivate,
    visibility: (r.visibility as "org" | "private" | "public") ?? "org",
    content: r.content,
    createdAt: String(r.createdAt),
  };
}

export const coachNotesRepository = makeCoachNotesRepository();
