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
      const details = await conversationsService.getConversation(req.authCtx, {
        conversationId: params.conversationId,
        orgId: params.orgId,
      });
      return NextResponse.json(details);
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);

export const PATCH = withApiAuth(
  async (
    req: AuthedRequest,
    { params }: { params: { orgId: string; conversationId: string } }
  ) => {
    try {
      const body = await req.json().catch(() => ({}));
      await conversationsService.setPinned(req.authCtx, {
        orgId: params.orgId,
        conversationId: params.conversationId,
        isPinned: Boolean(body?.isPinned),
      });
      return NextResponse.json({ ok: true });
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);
