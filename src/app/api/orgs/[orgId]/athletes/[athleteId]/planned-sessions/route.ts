import { NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { handleApiError, AppError } from "@/shared/errors";
import { planningService } from "@/features/planning/service";

export async function GET(
  req: Request,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const url = new URL(req.url);
    const q = Object.fromEntries(url.searchParams);

    const data = await planningService.listPlannedSessions({
      orgId: params.orgId,
      athleteId: params.athleteId,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
      dateFrom: (q.dateFrom as string) ?? undefined,
      dateTo: (q.dateTo as string) ?? undefined,
      orderBy: (q.orderBy as any) ?? undefined,
      order: (q.order as any) ?? undefined,
    });

    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));
    const data = await planningService.createPlannedSession({
      orgId: params.orgId,
      athleteId: params.athleteId,
      plannedDate: body.plannedDate,
      title: body.title ?? null,
      notes: body.notes ?? null,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
