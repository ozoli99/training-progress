import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { progressionService } from "@/features/progression/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; ruleId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const row = await progressionService.getRuleById({
      orgId: ctx.orgId!,
      ruleId: params.ruleId,
    });
    if (!row) throw new AppError.NotFound("Rule not found");
    return NextResponse.json(row);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; ruleId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));
    const updated = await progressionService.updateRule({
      orgId: ctx.orgId!,
      ruleId: params.ruleId,
      name: body.name,
      appliesTo: body.appliesTo,
      exerciseId: body.exerciseId,
      workoutId: body.workoutId,
      conditionJson: body.conditionJson,
      active: body.active,
    });

    return NextResponse.json(updated);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; ruleId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await progressionService.deleteRule({
      orgId: ctx.orgId!,
      ruleId: params.ruleId,
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
