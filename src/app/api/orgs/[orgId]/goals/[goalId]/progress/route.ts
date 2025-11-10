import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { goalsService } from "@/features/goals/service";

export const dynamic = "force-dynamic";

function readDate(qp: URLSearchParams, key: string): Date | undefined {
  const v = qp.get(key);
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    throw new AppError.Validation(`${key} must be a valid ISO date/time`);
  }
  return d;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; goalId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const url = new URL(req.url);
    const qp = url.searchParams;

    const data = await goalsService.listGoalProgress({
      orgId: params.orgId,
      athleteGoalId: params.goalId,
      createdFrom: readDate(qp, "createdFrom"),
      createdTo: readDate(qp, "createdTo"),
      orderBy: (qp.get("orderBy") as any) ?? undefined, // "id" | "createdAt"
      order: (qp.get("order") as any) ?? undefined, // "asc" | "desc"
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
  { params }: { params: { orgId: string; goalId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");
    const body = await req.json().catch(() => ({}));

    const data = await goalsService.createGoalProgress({
      orgId: params.orgId,
      athleteGoalId: params.goalId,
      sessionId: body.sessionId,
      sourceEntityId: body.sourceEntityId,
      sourceEntityType: body.sourceEntityType,
      value: body.value,
      note: body.note,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
