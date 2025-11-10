import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { goalsService } from "@/features/goals/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const url = new URL(req.url);
    const qp = url.searchParams;

    const data = await goalsService.listGoals({
      orgId: params.orgId,
      athleteId: qp.get("athleteId") ?? undefined,
      status: (qp.get("status") as any) ?? undefined, // GoalStatus
      goalType: qp.get("goalType") ?? undefined,
      targetFrom: qp.get("targetFrom") ?? undefined, // ISO date (string)
      targetTo: qp.get("targetTo") ?? undefined, // ISO date (string)
      orderBy: (qp.get("orderBy") as any) ?? undefined, // "id"|"title"|...
      order: (qp.get("order") as any) ?? undefined, // "asc"|"desc"
      limit: qp.get("limit") ? Number(qp.get("limit")) : undefined,
      offset: qp.get("offset") ? Number(qp.get("offset")) : undefined,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));

    const data = await goalsService.createGoal({
      orgId: params.orgId,
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

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
