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
        exerciseId: z.string().uuid(),
        sequenceIndex: z.coerce.number().int().nonnegative(),
        reps: z.coerce.number().int().nonnegative().nullable().optional(),
        loadKg: z.coerce.number().nullable().optional(), // repo stringifies
        scaled: z.boolean().optional(),
        scaledToExerciseId: z.string().uuid().nullable().optional(),
        actualPrescription: z.unknown().optional(),
        equipmentExtra: z.unknown().optional(),
      })
    )
    .max(2000)
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
    const items = await workoutLogsService.listEntries({
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
    const items = await workoutLogsService.replaceEntries({
      orgId,
      workoutLogId,
      items: body.items,
    });
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
