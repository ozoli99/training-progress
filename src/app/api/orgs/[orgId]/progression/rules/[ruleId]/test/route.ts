import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { progressionService } from "@/features/progression/service";

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; ruleId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const { context } = (await req.json().catch(() => ({}))) as {
      context?: Record<string, unknown>;
    };

    const result = await progressionService.triggerRun({
      orgId: ctx.orgId!,
      ruleId: params.ruleId,
      context,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
