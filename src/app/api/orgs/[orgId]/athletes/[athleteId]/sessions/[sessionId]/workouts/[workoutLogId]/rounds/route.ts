import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { workoutLogsService } from "@/features/workout-logs/service";

const ZParams = z.object({
  orgId: z.string().uuid(),
  athleteId: z.string().uuid(),
  sessionId: z.string().uuid(),
  workoutLogId: z.string().uuid(),
});

const ZListQuery = z.object({
  order: z.enum(["asc", "desc"]).optional(),
});

const ZReplaceBody = z.object({
  items: z
    .array(
      z.object({
        roundIndex: z.coerce.number().int().nonnegative(),
        durationS: z.coerce.number().nullable().optional(), // repo stringifies
        repsTotal: z.coerce.number().int().nonnegative().nullable().optional(),
        notes: z.string().nullable().optional(),
        entries: z
          .array(
            z.object({
              exerciseId: z.string().uuid(),
              reps: z.coerce.number().int().nonnegative().nullable().optional(),
              loadKg: z.coerce.number().nullable().optional(), // repo stringifies
              extra: z.unknown().optional(),
            })
          )
          .optional(),
      })
    )
    .max(1000)
    .default([]),
});

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      sessionId: string;
      workoutLogId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutLogId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const query = ZListQuery.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    const items = await workoutLogsService.listRounds({
      orgId,
      workoutLogId,
      order: query.order,
    });
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      sessionId: string;
      workoutLogId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutLogId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const body = ZReplaceBody.parse(await req.json().catch(() => ({})));
    const res = await workoutLogsService.replaceRounds({
      orgId,
      workoutLogId,
      items: body.items,
    });
    return NextResponse.json(res);
  } catch (err) {
    return handleApiError(err);
  }
}
