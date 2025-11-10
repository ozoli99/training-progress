import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { progressionService } from "@/features/progression/service";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");
    const orderBy = url.searchParams.get("orderBy") as
      | "executedAt"
      | "status"
      | null;
    const order = url.searchParams.get("order") as "asc" | "desc" | null;
    const ruleId = url.searchParams.get("ruleId") || undefined;

    const rows = await progressionService.listRuns({
      orgId: ctx.orgId!,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      orderBy: orderBy ?? undefined,
      order: order ?? undefined,
      ruleId,
    });

    return NextResponse.json(rows);
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
    const result = await progressionService.triggerRun({
      orgId: ctx.orgId!,
      ruleId: body.ruleId,
      context: body.context,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
