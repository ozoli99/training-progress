import { repoGetSessionById } from "@/features/sessions/repository";
import {
  repoDeleteBlock,
  repoGetBlock,
  repoInsertBlock,
  repoListBlocksBySession,
  repoUpdateBlock,
} from "./repository";

export async function listBlocksService(sessionId: string) {
  return repoListBlocksBySession(sessionId);
}

export async function createBlockService(
  ctx: { orgId: string; athleteId: string },
  sessionId: string,
  input: {
    blockType?: string;
    title?: string;
    notes?: string;
  }
) {
  const s = await repoGetSessionById(sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  return repoInsertBlock({
    sessionId,
    blockType: input.blockType ?? null,
    title: input.title ?? null,
    notes: input.notes ?? null,
  });
}

export async function updateBlockService(
  ctx: { orgId: string; athleteId: string },
  blockId: string,
  patch: {
    blockType?: string;
    title?: string;
    notes?: string;
    blockIndex?: number;
  }
) {
  const b = await repoGetBlock(blockId);
  if (!b) throw new Error("Block not found");
  const s = await repoGetSessionById(b.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  const updated = await repoUpdateBlock(blockId, {
    blockType: patch.blockType ?? null,
    title: patch.title ?? null,
    notes: patch.notes ?? null,
    blockIndex: patch.blockIndex,
  });
  if (!updated) throw new Error("Update failed");
  return updated;
}

export async function deleteBlockService(
  ctx: { orgId: string; athleteId: string },
  blockId: string
) {
  const b = await repoGetBlock(blockId);
  if (!b) throw new Error("Block not found");
  const s = await repoGetSessionById(b.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  await repoDeleteBlock(blockId);
}
