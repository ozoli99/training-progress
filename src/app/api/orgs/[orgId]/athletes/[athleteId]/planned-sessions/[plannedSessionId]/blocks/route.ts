import { NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { handleApiError, AppError } from "@/shared/errors";
import { planningService } from "@/features/planning/service";

export async function GET(
  _req: Request,
  {
    params,
  }: { params: { orgId: string; athleteId: string; plannedSessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    // service expects orgId to validate ownership
    const data = await planningService.listPlannedBlocks({
      orgId: params.orgId,
      plannedSessionId: params.plannedSessionId,
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
  }: { params: { orgId: string; athleteId: string; plannedSessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));
    const data = await planningService.createPlannedBlock({
      orgId: params.orgId,
      plannedSessionId: params.plannedSessionId,
      blockIndex: body.blockIndex,
      blockType: body.blockType ?? null,
      title: body.title ?? null,
      notes: body.notes ?? null,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
