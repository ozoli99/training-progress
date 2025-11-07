import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { workoutLogsService } from "@/features/workout-logs/service";

const ZParams = z.object({
  orgId: z.string().uuid(),
  athleteId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

const ZListQuery = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

const ZCreateBody = z.object({
  sessionBlockId: z.string().uuid().optional(),
  workoutId: z.string().uuid(),
  plannedWorkoutId: z.string().uuid().optional(),
  workoutVersionId: z.string().uuid().optional(),
  resultRaw: z.string().optional(),
  resultPrimary: z.coerce.number().optional(),
  asRx: z.boolean().optional(),
  isDraft: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, sessionId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const query = ZListQuery.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    const items = await workoutLogsService.list({
      orgId,
      sessionId,
      ...query,
    });

    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
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
    const { orgId, sessionId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const body = ZCreateBody.parse(await req.json().catch(() => ({})));
    const row = await workoutLogsService.create({
      orgId,
      sessionId,
      ...body,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
