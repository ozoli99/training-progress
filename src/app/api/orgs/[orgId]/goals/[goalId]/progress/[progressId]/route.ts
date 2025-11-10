import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { goalsService } from "@/features/goals/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; goalId: string; progressId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const data = await goalsService.getGoalProgress({
      orgId: params.orgId,
      id: params.progressId,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; goalId: string; progressId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");
    const body = await req.json().catch(() => ({}));

    const data = await goalsService.updateGoalProgress({
      orgId: params.orgId,
      id: params.progressId,
      sessionId: body.sessionId,
      sourceEntityId: body.sourceEntityId,
      sourceEntityType: body.sourceEntityType,
      value: body.value,
      note: body.note,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; goalId: string; progressId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await goalsService.deleteGoalProgress({
      orgId: params.orgId,
      id: params.progressId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
