import { NextResponse } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { handleApiError } from "@/shared/errors";
import { domainEventsService } from "@/features/domain-events/service";

export const GET = withApiAuth(
  async (
    req: AuthedRequest,
    { params }: { params: { orgId: string; eventId: string } }
  ) => {
    try {
      const item = await domainEventsService.getEvent(req.authCtx, {
        orgId: params.orgId,
        eventId: params.eventId,
      });
      return NextResponse.json(item);
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);

export const PATCH = withApiAuth(
  async (
    req: AuthedRequest,
    { params }: { params: { orgId: string; eventId: string } }
  ) => {
    try {
      const body = await req.json().catch(() => ({}));
      await domainEventsService.markProcessed(req.authCtx, {
        orgId: params.orgId,
        eventId: params.eventId,
        processedAt:
          typeof body?.processedAt === "string" && body.processedAt
            ? body.processedAt
            : undefined,
      });
      return NextResponse.json({ ok: true });
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);
