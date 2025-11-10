import { NextResponse } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { handleApiError } from "@/shared/errors";
import { conversationsService } from "@/features/conversations/service";

export const POST = withApiAuth(
  async (
    req: AuthedRequest,
    {
      params,
    }: { params: { orgId: string; conversationId: string; messageId: string } }
  ) => {
    try {
      await conversationsService.markMessageRead(req.authCtx, {
        orgId: params.orgId,
        conversationId: params.conversationId,
        messageId: params.messageId,
      });
      return NextResponse.json({ ok: true });
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);
