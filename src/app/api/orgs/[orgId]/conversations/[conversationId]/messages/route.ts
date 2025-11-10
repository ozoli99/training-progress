import { NextResponse, type NextRequest } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { handleApiError } from "@/shared/errors";
import { conversationsService } from "@/features/conversations/service";

export const GET = withApiAuth(
  async (
    req: AuthedRequest,
    { params }: { params: { orgId: string; conversationId: string } }
  ) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = Number(searchParams.get("limit") ?? "50");
      const cursor = searchParams.get("cursor") ?? undefined;

      const page = await conversationsService.listMessages(req.authCtx, {
        orgId: params.orgId,
        conversationId: params.conversationId,
        limit,
        cursor,
      });
      return NextResponse.json(page);
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);

export const POST = withApiAuth(
  async (
    req: AuthedRequest,
    { params }: { params: { orgId: string; conversationId: string } }
  ) => {
    try {
      const body = await req.json().catch(() => ({}));
      const sent = await conversationsService.sendMessage(req.authCtx, {
        orgId: params.orgId,
        conversationId: params.conversationId,
        body: String(body?.body ?? ""),
        metadata: body?.metadata,
      });
      return NextResponse.json(sent, { status: 201 });
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);
