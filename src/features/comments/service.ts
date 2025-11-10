import {
  CommentItem,
  CommentThreadItem,
  CreateCommentInput,
  DeleteCommentInput,
  EnsureThreadInput,
  ListCommentsInput,
  ListThreadsInput,
  Page,
  UpdateCommentInput,
  type TCommentItem,
  type TCommentThreadItem,
} from "./dto";
import type { ICommentsRepository } from "./repository";
import { AppError } from "@/shared/errors";
import type { AuthContext } from "@/features/auth/context";

function canReadComment(
  ctx: AuthContext,
  c: TCommentItem,
  threadOrgId: string
) {
  if (c.visibility === "public") return true;
  if (c.visibility === "org") return ctx.orgId === threadOrgId;
  return ctx.userId === c.authorUserId;
}

function canWriteInThread(ctx: AuthContext, threadOrgId: string) {
  return ctx.orgId === threadOrgId;
}

function canEditOrDelete(
  ctx: AuthContext,
  c: TCommentItem,
  threadOrgId: string
) {
  if (ctx.userId === c.authorUserId) return true;
  return false;
}

export function makeCommentsService(repo: ICommentsRepository) {
  return {
    async ensureThread(
      ctx: AuthContext,
      input: unknown
    ): Promise<TCommentThreadItem> {
      const data = EnsureThreadInput.parse(input);
      if (!ctx.orgId)
        throw new AppError.Forbidden("Organization not selected.");
      if (ctx.orgId !== data.orgId)
        throw new AppError.Forbidden("Cross-org access denied.");

      const t = await repo.ensureThread(data);
      return CommentThreadItem.parse(t);
    },

    async listThreads(ctx: AuthContext, input: unknown) {
      const data = ListThreadsInput.parse(input);
      if (!ctx.orgId)
        throw new AppError.Forbidden("Organization not selected.");
      if (ctx.orgId !== data.orgId)
        throw new AppError.Forbidden("Cross-org access denied.");

      const page = await repo.listThreadsByEntity({
        orgId: data.orgId,
        entityType: data.entityType,
        entityId: data.entityId,
        limit: data.limit,
        cursor: data.cursor,
      });

      return Page(CommentThreadItem).parse(page);
    },

    async listComments(ctx: AuthContext, input: unknown) {
      const data = ListCommentsInput.parse(input);

      const thread = await repo.getThreadById(data.threadId);
      if (!thread) throw new AppError.NotFound("Thread not found.");
      if (ctx.orgId !== thread.orgId)
        throw new AppError.Forbidden("Thread belongs to another organization.");

      const page = await repo.listComments({
        threadId: data.threadId,
        limit: data.limit,
        cursor: data.cursor,
      });

      const visible = page.items.filter((c) =>
        canReadComment(ctx, c, thread.orgId)
      );
      return Page(CommentItem).parse({
        items: visible,
        nextCursor: page.nextCursor,
      });
    },

    async createComment(
      ctx: AuthContext,
      input: unknown
    ): Promise<TCommentItem> {
      const data = CreateCommentInput.parse(input);

      const thread = await repo.getThreadById(data.threadId);
      if (!thread) throw new AppError.NotFound("Thread not found.");
      if (!canWriteInThread(ctx, thread.orgId))
        throw new AppError.Forbidden(
          "No permission to comment in this thread."
        );

      const created = await repo.createComment({
        threadId: data.threadId,
        authorUserId: ctx.userId,
        content: data.content,
        visibility: data.visibility ?? "org",
      });

      return CommentItem.parse(created);
    },

    async updateComment(
      ctx: AuthContext,
      input: unknown
    ): Promise<TCommentItem> {
      const data = UpdateCommentInput.parse(input);

      const existing = await repo.getCommentById(data.commentId);
      if (!existing) throw new AppError.NotFound("Comment not found.");

      const thread = await repo.getThreadById(existing.threadId);
      if (!thread) throw new AppError.NotFound("Thread not found.");

      if (!canEditOrDelete(ctx, existing, thread.orgId))
        throw new AppError.Forbidden("You cannot edit this comment.");

      const updated = await repo.updateComment({
        commentId: data.commentId,
        content: data.content,
        visibility: data.visibility,
      });
      if (!updated)
        throw new AppError.NotFound("Comment not found after update.");

      return CommentItem.parse(updated);
    },

    async deleteComment(ctx: AuthContext, input: unknown): Promise<void> {
      const data = DeleteCommentInput.parse(input);

      const existing = await repo.getCommentById(data.commentId);
      if (!existing) throw new AppError.NotFound("Comment not found.");

      const thread = await repo.getThreadById(existing.threadId);
      if (!thread) throw new AppError.NotFound("Thread not found.");

      if (!canEditOrDelete(ctx, existing, thread.orgId))
        throw new AppError.Forbidden("You cannot delete this comment.");

      await repo.deleteComment(data.commentId);
    },
  };
}

import { commentsRepository } from "./repository";
export const commentsService = makeCommentsService(commentsRepository);
