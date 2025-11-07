import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { sessionsService } from "@/features/sessions/service";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const updated = await sessionsService.update({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      status: "in_progress",
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
