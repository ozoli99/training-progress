import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { sessionBlocksService } from "@/features/session-blocks/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ZRouteParams = z.object({
  orgId: z.string().min(1),
  athleteId: z.string().min(1),
  sessionId: z.string().min(1),
});

const ZListQuery = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, athleteId, sessionId } = ZRouteParams.parse(params);

    const search = ZListQuery.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const data = await sessionBlocksService.list({
      orgId,
      athleteId,
      sessionId,
      limit: search.limit,
      offset: search.offset,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, athleteId, sessionId } = ZRouteParams.parse(params);
    const body = await req.json().catch(() => ({}));

    const created = await sessionBlocksService.create({
      orgId,
      athleteId,
      sessionId,
      ...body,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
