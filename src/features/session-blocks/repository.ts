import { db } from "@/infrastructure/db/client";
import { sessionBlock } from "@/infrastructure/db/schema";
import { and, asc, eq, max } from "drizzle-orm";

export async function repoListBlocksBySession(sessionId: string) {
  return db
    .select()
    .from(sessionBlock)
    .where(eq(sessionBlock.sessionId, sessionId))
    .orderBy(asc(sessionBlock.blockIndex));
}

export async function repoGetBlock(blockId: string) {
  const [row] = await db
    .select()
    .from(sessionBlock)
    .where(eq(sessionBlock.id, blockId))
    .limit(1);
  return row ?? null;
}

export async function repoInsertBlock(input: {
  sessionId: string;
  blockType?: string | null;
  title?: string | null;
  notes?: string | null;
}) {
  const [agg] = await db
    .select({ mx: max(sessionBlock.blockIndex).as("mx") })
    .from(sessionBlock)
    .where(eq(sessionBlock.sessionId, input.sessionId));

  const nextIndex = (agg?.mx ?? 0) + 1;

  const [row] = await db
    .insert(sessionBlock)
    .values({
      sessionId: input.sessionId,
      blockIndex: nextIndex,
      blockType: input.blockType ?? null,
      title: input.title ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row!;
}

export async function repoUpdateBlock(
  blockId: string,
  patch: {
    blockType?: string | null;
    title?: string | null;
    notes?: string | null;
    blockIndex?: number;
  }
) {
  const [row] = await db
    .update(sessionBlock)
    .set({
      blockType: patch.blockType,
      title: patch.title,
      notes: patch.notes,
      blockIndex: patch.blockIndex ?? undefined,
    })
    .where(eq(sessionBlock.id, blockId))
    .returning();
  return row ?? null;
}

export async function repoDeleteBlock(blockId: string) {
  await db.delete(sessionBlock).where(eq(sessionBlock.id, blockId));
}
