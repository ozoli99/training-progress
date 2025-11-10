import { NextResponse, type NextRequest } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { handleApiError } from "@/shared/errors";
import { conversationsService } from "@/features/conversations/service";

export const GET = withApiAuth(
  async (req: AuthedRequest, { params }: { params: { orgId: string } }) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = Number(searchParams.get("limit") ?? "20");
      const cursor = searchParams.get("cursor") ?? undefined;

      const page = await conversationsService.listConversations(req.authCtx, {
        orgId: params.orgId,
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
  async (req: AuthedRequest, { params }: { params: { orgId: string } }) => {
    try {
      const body = await req.json().catch(() => ({}));
      const created = await conversationsService.createConversation(
        req.authCtx,
        {
          orgId: params.orgId,
          subject: body?.subject,
          type: body?.type,
          participantUserIds: Array.isArray(body?.participantUserIds)
            ? body.participantUserIds
            : [],
        }
      );
      return NextResponse.json(created, { status: 201 });
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);
