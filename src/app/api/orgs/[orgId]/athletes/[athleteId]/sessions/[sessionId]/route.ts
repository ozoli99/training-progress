import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { sessionsService } from "@/features/sessions/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const row = await sessionsService.get({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
    });

    if (!row) throw new AppError.NotFound("Session not found.");
    return NextResponse.json(row);
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));
    const updated = await sessionsService.update({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      sessionDate: body.sessionDate,
      status: body.status,
      plannedSessionId: body.plannedSessionId,
      trainingLocationId: body.trainingLocationId,
      completionPct: body.completionPct,
      loadSource: body.loadSource,
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await sessionsService.delete({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
