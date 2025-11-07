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

const ZPatchBody = z
  .object({
    sessionBlockId: z.string().uuid().nullable().optional(),
    workoutId: z.string().uuid().optional(),
    plannedWorkoutId: z.string().uuid().nullable().optional(),
    workoutVersionId: z.string().uuid().nullable().optional(),
    resultRaw: z.string().nullable().optional(),
    resultPrimary: z.coerce.number().nullable().optional(), // repo stringifies
    asRx: z.boolean().optional(),
    isDraft: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "No fields to update.",
  });

export async function GET(
  _req: NextRequest,
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
    const { orgId, sessionId, workoutLogId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const row = await workoutLogsService.get({
      orgId,
      sessionId,
      workoutLogId,
    });
    return NextResponse.json(row);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
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
    const { orgId, sessionId, workoutLogId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const patch = ZPatchBody.parse(await req.json().catch(() => ({})));
    const row = await workoutLogsService.update({
      orgId,
      sessionId,
      workoutLogId,
      ...patch,
    });
    return NextResponse.json(row);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
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
    const { orgId, sessionId, workoutLogId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const res = await workoutLogsService.delete({
      orgId,
      sessionId,
      workoutLogId,
    });
    if (!res.ok)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
