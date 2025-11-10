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

    const data = await planningService.getPlannedSession({
      orgId: params.orgId,
      id: params.plannedSessionId,
    });

    if (!data || data.athleteId !== params.athleteId)
      throw new AppError.NotFound();
    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(
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
    const updated = await planningService.updatePlannedSession({
      orgId: params.orgId,
      id: params.plannedSessionId,
      athleteId: body.athleteId,
      plannedDate: body.plannedDate,
      title: body.title,
      notes: body.notes,
    });

    if (!updated || updated.athleteId !== params.athleteId)
      throw new AppError.NotFound();
    return NextResponse.json(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: { params: { orgId: string; athleteId: string; plannedSessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const existing = await planningService.getPlannedSession({
      orgId: params.orgId,
      id: params.plannedSessionId,
    });
    if (!existing || existing.athleteId !== params.athleteId)
      throw new AppError.NotFound();

    await planningService.deletePlannedSession({
      orgId: params.orgId,
      id: params.plannedSessionId,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
