import { NextResponse } from "next/server";
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
      const list = await conversationsService.listParticipants(req.authCtx, {
        orgId: params.orgId,
        conversationId: params.conversationId,
      });
      return NextResponse.json(list);
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
      const res = await conversationsService.upsertParticipant(req.authCtx, {
        orgId: params.orgId,
        conversationId: params.conversationId,
        userId: String(body?.userId ?? ""),
        isPinned:
          typeof body?.isPinned === "boolean" ? body.isPinned : undefined,
      });
      return NextResponse.json(res, { status: 201 });
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);

export const DELETE = withApiAuth(
  async (
    req: AuthedRequest,
    { params }: { params: { orgId: string; conversationId: string } }
  ) => {
    try {
      const body = await req.json().catch(() => ({}));
      await conversationsService.removeParticipant(req.authCtx, {
        orgId: params.orgId,
        conversationId: params.conversationId,
        userId: String(body?.userId ?? ""),
      });
      return NextResponse.json({ ok: true });
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);
