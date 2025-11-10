import { NextResponse } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { commentsService } from "@/features/comments/service";

export const dynamic = "force-dynamic";

export const GET = withApiAuth(
  async (
    req: AuthedRequest,
    { params }: { params: { orgId: string; threadId: string } }
  ) => {
    const { authCtx } = req;
    const { threadId } = params;

    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") || undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitRaw ?? 20) || 20, 1), 100);

    const page = await commentsService.listComments(authCtx, {
      threadId,
      limit,
      cursor,
    });

    return NextResponse.json(page, { status: 200 });
  },
  { scope: "org" }
);

export const POST = withApiAuth(
  async (
    req: AuthedRequest,
    { params }: { params: { orgId: string; threadId: string } }
  ) => {
    const { authCtx } = req;
    const { threadId } = params;

    const body = await req.json().catch(() => ({}));
    const content: string = body?.content ?? "";
    const visibility: "public" | "org" | "private" = body?.visibility ?? "org";

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required." },
        { status: 400 }
      );
    }

    const created = await commentsService.createComment(authCtx, {
      threadId,
      content,
      visibility,
    });

    return NextResponse.json(created, { status: 201 });
  },
  { scope: "org" }
);
