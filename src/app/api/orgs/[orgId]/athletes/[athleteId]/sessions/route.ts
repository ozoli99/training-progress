import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { sessionsService } from "@/features/sessions/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const url = new URL(req.url);
    const q = Object.fromEntries(url.searchParams.entries());

    const data = await sessionsService.list({
      orgId: params.orgId,
      athleteId: params.athleteId,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      status: q.status,
      plannedSessionId: q.plannedSessionId,
      trainingLocationId: q.trainingLocationId,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    });

    return NextResponse.json(data);
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));
    const created = await sessionsService.create({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionDate: body.sessionDate,
      status: body.status,
      plannedSessionId: body.plannedSessionId,
      trainingLocationId: body.trainingLocationId,
      completionPct: body.completionPct,
      loadSource: body.loadSource,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
