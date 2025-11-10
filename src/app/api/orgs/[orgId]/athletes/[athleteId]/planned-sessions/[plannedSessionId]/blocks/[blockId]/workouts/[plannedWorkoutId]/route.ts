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
      plannedWorkoutId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const data = await planningService.getPlannedWorkout({
      orgId: params.orgId,
      id: params.plannedWorkoutId,
    });

    if (!data) throw new AppError.NotFound();
    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      plannedSessionId: string;
      blockId: string;
      plannedWorkoutId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));
    const updated = await planningService.updatePlannedWorkout({
      orgId: params.orgId,
      id: params.plannedWorkoutId,
      workoutId: body.workoutId,
      targetResult: body.targetResult,
    });

    if (!updated) throw new AppError.NotFound();
    return NextResponse.json(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      plannedSessionId: string;
      blockId: string;
      plannedWorkoutId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await planningService.deletePlannedWorkout({
      orgId: params.orgId,
      id: params.plannedWorkoutId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
