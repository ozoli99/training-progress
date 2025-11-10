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

    const block = await planningService.getPlannedBlock({
      orgId: params.orgId,
      id: params.blockId,
    });

    if (!block) throw new AppError.NotFound();
    return NextResponse.json(block);
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
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));
    const updated = await planningService.updatePlannedBlock({
      orgId: params.orgId,
      id: params.blockId,
      blockIndex: body.blockIndex,
      blockType: body.blockType,
      title: body.title,
      notes: body.notes,
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
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await planningService.deletePlannedBlock({
      orgId: params.orgId,
      id: params.blockId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
