import { z } from "zod";

export const UUID = z.string().uuid();
export const ISODate = z.string().datetime();

export const CommentVisibility = z.enum(["public", "org", "private"]);

export const CommentThreadItem = z.object({
  id: UUID,
  orgId: UUID,
  entityType: z.string(),
  entityId: UUID,
  createdAt: ISODate,
  commentsCount: z.number().int().nonnegative().default(0),
  lastCommentAt: ISODate.optional(),
});

export const CommentItem = z.object({
  id: UUID,
  threadId: UUID,
  authorUserId: UUID,
  authorName: z.string().nullable().optional(),
  authorAvatarUrl: z.string().url().nullable().optional(),
  content: z.string(),
  visibility: CommentVisibility,
  createdAt: ISODate,
  updatedAt: ISODate,
});

export const EnsureThreadInput = z.object({
  orgId: UUID,
  entityType: z.string(),
  entityId: UUID,
});

export const ListThreadsInput = z.object({
  orgId: UUID,
  entityType: z.string(),
  entityId: UUID,
  limit: z.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const ListCommentsInput = z.object({
  threadId: UUID,
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
});

export const CreateCommentInput = z.object({
  threadId: UUID,
  content: z.string().min(1).max(20_000),
  visibility: CommentVisibility.default("org"),
});

export const UpdateCommentInput = z.object({
  commentId: UUID,
  content: z.string().min(1).max(20_000),
  visibility: CommentVisibility.optional(),
});

export const DeleteCommentInput = z.object({
  commentId: UUID,
});

export const Page = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

export type TCommentItem = z.infer<typeof CommentItem>;
export type TCommentThreadItem = z.infer<typeof CommentThreadItem>;

export type TEnsureThreadInput = z.infer<typeof EnsureThreadInput>;
export type TListThreadsInput = z.infer<typeof ListThreadsInput>;
export type TListCommentsInput = z.infer<typeof ListCommentsInput>;
export type TCreateCommentInput = z.infer<typeof CreateCommentInput>;
export type TUpdateCommentInput = z.infer<typeof UpdateCommentInput>;
export type TDeleteCommentInput = z.infer<typeof DeleteCommentInput>;

export type TThreadsPage = z.infer<
  ReturnType<typeof Page<typeof CommentThreadItem>>
>;
export type TCommentsPage = z.infer<
  ReturnType<typeof Page<typeof CommentItem>>
>;
