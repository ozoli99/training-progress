import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { progressionService } from "@/features/progression/service";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; runId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const url = new URL(req.url);
    const include = (url.searchParams.get("include") || "")
      .split(",")
      .map((s) => s.trim());
    const includeActions = include.includes("actions");

    const run = await progressionService.getRunById({
      orgId: ctx.orgId!,
      runId: params.runId,
    });
    if (!run) throw new AppError.NotFound("Run not found");

    if (!includeActions) {
      return NextResponse.json(run);
    }

    const actions = await progressionService.listActions({
      orgId: ctx.orgId!,
      runId: params.runId,
    });

    return NextResponse.json({ run, actions });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
