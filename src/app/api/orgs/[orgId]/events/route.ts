import { NextResponse } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { handleApiError } from "@/shared/errors";
import { domainEventsService } from "@/features/domain-events/service";

function parseBool(param: string | null): boolean | undefined {
  if (param === null) return undefined;
  if (param.toLowerCase() === "true") return true;
  if (param.toLowerCase() === "false") return false;
  return undefined;
}

export const GET = withApiAuth(
  async (req: AuthedRequest, { params }: { params: { orgId: string } }) => {
    try {
      const url = new URL(req.url);
      const q = url.searchParams;

      const res = await domainEventsService.listEvents(req.authCtx, {
        orgId: params.orgId,
        eventType: q.get("eventType") ?? undefined,
        entityType: q.get("entityType") ?? undefined,
        entityId: q.get("entityId") ?? undefined,
        sourceSystem: q.get("sourceSystem") ?? undefined,
        processed: parseBool(q.get("processed")),
        from: q.get("from") ?? undefined, // ISO
        to: q.get("to") ?? undefined, // ISO
        limit: Math.min(100, Math.max(1, Number(q.get("limit") ?? "25") || 25)),
        cursor: q.get("cursor") ?? undefined,
      });

      return NextResponse.json(res);
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
      const created = await domainEventsService.createEvent(req.authCtx, {
        orgId: params.orgId,
        eventType: String(body?.eventType ?? ""),
        entityType: String(body?.entityType ?? ""),
        entityId: String(body?.entityId ?? ""),
        sourceSystem:
          typeof body?.sourceSystem === "string"
            ? body.sourceSystem
            : undefined,
        isPublic:
          typeof body?.isPublic === "boolean" ? body.isPublic : undefined,
        payload: body?.payload,
        occurredAt:
          typeof body?.occurredAt === "string" && body.occurredAt
            ? body.occurredAt
            : undefined,
      });

      return NextResponse.json(created, { status: 201 });
    } catch (err) {
      return handleApiError(err);
    }
  },
  { scope: "org" }
);
