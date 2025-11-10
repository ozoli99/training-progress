import { NextResponse, type NextRequest } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { commentsService } from "@/features/comments/service";

export const dynamic = "force-dynamic";

export const GET = withApiAuth(
  async (req: AuthedRequest, { params }: { params: { orgId: string } }) => {
    const { authCtx } = req;
    const { orgId } = params;

    const url = new URL(req.url);
    const entityType = url.searchParams.get("entityType") || "";
    const entityId = url.searchParams.get("entityId") || "";
    const cursor = url.searchParams.get("cursor") || undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitRaw ?? 20) || 20, 1), 100);

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing entityType or entityId" },
        { status: 400 }
      );
    }

    const page = await commentsService.listThreads(authCtx, {
      orgId,
      entityType,
      entityId,
      limit,
      cursor,
    });

    return NextResponse.json(page, { status: 200 });
  },
  { scope: "org" }
);

export const POST = withApiAuth(
  async (req: AuthedRequest, { params }: { params: { orgId: string } }) => {
    const { authCtx } = req;
    const { orgId } = params;

    const body = await req.json().catch(() => ({}));
    const entityType: string = body?.entityType ?? "";
    const entityId: string = body?.entityId ?? "";

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing entityType or entityId" },
        { status: 400 }
      );
    }

    const thread = await commentsService.ensureThread(authCtx, {
      orgId,
      entityType,
      entityId,
    });

    return NextResponse.json(thread, { status: 201 });
  },
  { scope: "org" }
);
