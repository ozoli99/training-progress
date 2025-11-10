import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { goalsService } from "@/features/goals/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; goalId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const data = await goalsService.getGoal({
      orgId: params.orgId,
      id: params.goalId,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; goalId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");
    const body = await req.json().catch(() => ({}));

    const data = await goalsService.updateGoal({
      orgId: params.orgId,
      id: params.goalId,
      athleteId: body.athleteId,
      goalType: body.goalType,
      title: body.title,
      description: body.description,
      targetEntityType: body.targetEntityType,
      targetEntityId: body.targetEntityId,
      targetValue: body.targetValue,
      targetDate: body.targetDate,
      status: body.status,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; goalId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await goalsService.deleteGoal({ orgId: params.orgId, id: params.goalId });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
