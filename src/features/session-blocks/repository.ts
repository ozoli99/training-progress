import { and, eq, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  sessionBlock as SessionBlockTbl,
  session as SessionTbl,
  type sessionBlock as SessionBlockRow,
} from "@/infrastructure/db/schema";
import type {
  TSessionBlockRow,
  TListBlocksInput,
  TGetBlockInput,
  TCreateBlockInput,
  TUpdateBlockInput,
  TDeleteBlockInput,
} from "./dto";

export interface SessionBlocksRepository {
  list(input: TListBlocksInput): Promise<TSessionBlockRow[]>;
  get(input: TGetBlockInput): Promise<TSessionBlockRow | null>;
  create(input: TCreateBlockInput): Promise<TSessionBlockRow>;
  update(input: TUpdateBlockInput): Promise<TSessionBlockRow>;
  delete(input: TDeleteBlockInput): Promise<void>;
}

function mapRow(r: typeof SessionBlockRow.$inferSelect): TSessionBlockRow {
  return {
    id: r.id,
    sessionId: r.sessionId,
    blockIndex: r.blockIndex,
    blockType: r.blockType ?? null,
    title: r.title ?? null,
    notes: r.notes ?? null,
  };
}

export function makeSessionBlocksRepository(
  database = defaultDatabase
): SessionBlocksRepository {
  return {
    async list({ orgId, athleteId, sessionId, limit, offset }) {
      const [sess] = await database
        .select({ id: SessionTbl.id })
        .from(SessionTbl)
        .where(
          and(
            eq(SessionTbl.id, sessionId),
            eq(SessionTbl.orgId, orgId),
            eq(SessionTbl.athleteId, athleteId)
          )
        )
        .limit(1);

      if (!sess) return [];

      const q = database
        .select()
        .from(SessionBlockTbl)
        .where(eq(SessionBlockTbl.sessionId, sessionId))
        .orderBy(SessionBlockTbl.blockIndex);

      if (limit != null || offset != null) {
        (q as any).limit(limit ?? 50);
        if (offset != null) (q as any).offset(offset);
      }

      const rows = await q;
      return rows.map(mapRow);
    },

    async get({ orgId, athleteId, sessionId, blockId }) {
      const rows = await database
        .select({ sb: SessionBlockTbl })
        .from(SessionBlockTbl)
        .innerJoin(SessionTbl, eq(SessionTbl.id, SessionBlockTbl.sessionId))
        .where(
          and(
            eq(SessionBlockTbl.id, blockId),
            eq(SessionBlockTbl.sessionId, sessionId),
            eq(SessionTbl.orgId, orgId),
            eq(SessionTbl.athleteId, athleteId)
          )
        )
        .limit(1);

      const row = rows[0]?.sb;
      return row ? mapRow(row) : null;
    },

    async create({
      orgId,
      athleteId,
      sessionId,
      blockIndex,
      blockType,
      title,
      notes,
    }) {
      const [sess] = await database
        .select({ id: SessionTbl.id })
        .from(SessionTbl)
        .where(
          and(
            eq(SessionTbl.id, sessionId),
            eq(SessionTbl.orgId, orgId),
            eq(SessionTbl.athleteId, athleteId)
          )
        )
        .limit(1);
      if (!sess) throw new Error("Session not found for given org/athlete.");

      const [created] = await database
        .insert(SessionBlockTbl)
        .values({
          sessionId,
          blockIndex,
          blockType: blockType ?? null,
          title: title ?? null,
          notes: notes ?? null,
        })
        .returning();

      return mapRow(created);
    },

    async update({
      orgId,
      athleteId,
      sessionId,
      blockId,
      blockIndex,
      blockType,
      title,
      notes,
    }) {
      const existing = await this.get({ orgId, athleteId, sessionId, blockId });
      if (!existing)
        throw new Error("Session block not found or access denied.");

      const [updated] = await database
        .update(SessionBlockTbl)
        .set({
          blockIndex:
            blockIndex === undefined
              ? sql`${SessionBlockTbl.blockIndex}`
              : blockIndex,
          blockType:
            blockType === undefined
              ? sql`${SessionBlockTbl.blockType}`
              : (blockType as any),
          title:
            title === undefined
              ? sql`${SessionBlockTbl.title}`
              : (title as any),
          notes:
            notes === undefined
              ? sql`${SessionBlockTbl.notes}`
              : (notes as any),
        })
        .where(eq(SessionBlockTbl.id, blockId))
        .returning();

      return mapRow(updated!);
    },

    async delete({ orgId, athleteId, sessionId, blockId }) {
      const existing = await this.get({ orgId, athleteId, sessionId, blockId });
      if (!existing) return;

      await database
        .delete(SessionBlockTbl)
        .where(eq(SessionBlockTbl.id, blockId));
    },
  };
}

export const sessionBlocksRepository = makeSessionBlocksRepository();
