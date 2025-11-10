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

    const data = await planningService.listPlannedWorkouts({
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
    const created = await planningService.createPlannedWorkout({
      orgId: params.orgId,
      plannedSessionBlockId: params.blockId,
      workoutId: body.workoutId,
      targetResult: body.targetResult ?? null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
