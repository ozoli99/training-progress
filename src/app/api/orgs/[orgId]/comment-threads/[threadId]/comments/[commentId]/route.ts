import { NextResponse } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { commentsService } from "@/features/comments/service";
import { commentsRepository } from "@/features/comments/repository"; // for GET only

export const dynamic = "force-dynamic";

export const GET = withApiAuth(
  async (
    req: AuthedRequest,
    {
      params,
    }: { params: { orgId: string; threadId: string; commentId: string } }
  ) => {
    const { threadId, commentId } = params;

    const item = await commentsRepository.getCommentById(commentId);
    if (!item || item.threadId !== threadId) {
      return NextResponse.json(
        { error: "Comment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(item, { status: 200 });
  },
  { scope: "org" }
);

export const PATCH = withApiAuth(
  async (
    req: AuthedRequest,
    {
      params,
    }: { params: { orgId: string; threadId: string; commentId: string } }
  ) => {
    const { authCtx } = req;
    const { threadId, commentId } = params;

    const body = await req.json().catch(() => ({}));
    const content: string | undefined = body?.content;
    const visibility: "public" | "org" | "private" | undefined =
      body?.visibility;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required." },
        { status: 400 }
      );
    }

    const updated = await commentsService.updateComment(authCtx, {
      commentId,
      content,
      visibility,
    });

    if (!updated || updated.threadId !== threadId) {
      return NextResponse.json(
        { error: "Comment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  },
  { scope: "org" }
);

export const DELETE = withApiAuth(
  async (
    req: AuthedRequest,
    {
      params,
    }: { params: { orgId: string; threadId: string; commentId: string } }
  ) => {
    const { authCtx } = req;
    const { threadId, commentId } = params;

    const existing = await commentsRepository.getCommentById(commentId);
    if (!existing || existing.threadId !== threadId) {
      return NextResponse.json(
        { error: "Comment not found." },
        { status: 404 }
      );
    }

    await commentsService.deleteComment(authCtx, { commentId });
    return NextResponse.json({ ok: true }, { status: 204 });
  },
  { scope: "org" }
);
