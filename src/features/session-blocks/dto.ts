import { z } from "zod";

export const ZSessionBlockRow = z.object({
  id: z.string(),
  sessionId: z.string(),
  blockIndex: z.number(),
  blockType: z.string().nullish(),
  title: z.string().nullish(),
  notes: z.string().nullish(),
});
export type TSessionBlockRow = z.infer<typeof ZSessionBlockRow>;

export const ZListBlocksInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionId: z.string(),
  limit: z.number().int().positive().max(200).optional(),
  offset: z.number().int().nonnegative().optional(),
});
export type TListBlocksInput = z.infer<typeof ZListBlocksInput>;

export const ZGetBlockInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionId: z.string(),
  blockId: z.string(),
});
export type TGetBlockInput = z.infer<typeof ZGetBlockInput>;

export const ZCreateBlockInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionId: z.string(),
  blockIndex: z.number().int().nonnegative(),
  blockType: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});
export type TCreateBlockInput = z.infer<typeof ZCreateBlockInput>;

export const ZUpdateBlockInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionId: z.string(),
  blockId: z.string(),
  blockIndex: z.number().int().nonnegative().optional(),
  blockType: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type TUpdateBlockInput = z.infer<typeof ZUpdateBlockInput>;

export const ZDeleteBlockInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionId: z.string(),
  blockId: z.string(),
});
export type TDeleteBlockInput = z.infer<typeof ZDeleteBlockInput>;
