import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { intervalsService } from "@/features/intervals/service"; // adjust import path if needed

export const dynamic = "force-dynamic";

type Params = {
  params: { orgId: string; athleteId: string; sessionId: string };
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const sp = req.nextUrl.searchParams;
    const input = {
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      sessionBlockId: sp.get("sessionBlockId") ?? undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
      offset: sp.get("offset") ? Number(sp.get("offset")) : undefined,
    };

    const rows = await intervalsService.list(input);
    return NextResponse.json(rows, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));
    const input = {
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      sessionBlockId: body.sessionBlockId,
      exerciseId: body.exerciseId,
      intervalIndex: body.intervalIndex,
      targetValue: body.targetValue,
      durationS: body.durationS,
      notes: body.notes,
    };

    const created = await intervalsService.create(input);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
