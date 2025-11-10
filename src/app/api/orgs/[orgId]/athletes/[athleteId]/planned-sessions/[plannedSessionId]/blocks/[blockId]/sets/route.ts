import { NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { handleApiError, AppError } from "@/shared/errors";
import { planningService } from "@/features/planning/service";

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      plannedSessionId: string;
      blockId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const data = await planningService.listPlannedSets({
      orgId: params.orgId,
      plannedSessionBlockId: params.blockId,
    });

    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      plannedSessionId: string;
      blockId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));
    const data = await planningService.createPlannedSet({
      orgId: params.orgId,
      plannedSessionBlockId: params.blockId,
      exerciseId: body.exerciseId,
      setIndex: body.setIndex, // optional
      targetReps: body.targetReps ?? null,
      targetLoadKg: body.targetLoadKg ?? null,
      targetDurationS: body.targetDurationS ?? null,
      prescription: body.prescription ?? null,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
