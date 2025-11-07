import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { intervalsService } from "@/features/intervals/service"; // adjust import path if needed

export const dynamic = "force-dynamic";

type Params = {
  params: {
    orgId: string;
    athleteId: string;
    sessionId: string;
    intervalLogId: string;
  };
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const row = await intervalsService.get({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      intervalLogId: params.intervalLogId,
    });

    if (!row) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(row, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
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
      intervalLogId: params.intervalLogId,
      sessionBlockId: body.sessionBlockId,
      exerciseId: body.exerciseId,
      intervalIndex: body.intervalIndex,
      targetValue: body.targetValue,
      actualValue: body.actualValue,
      durationS: body.durationS,
      notes: body.notes,
    };

    const updated = await intervalsService.update(input);
    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    await intervalsService.delete({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      intervalLogId: params.intervalLogId,
    });

    return NextResponse.json({ ok: true }, { status: 204 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
