import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { skillsService } from "@/features/skills/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      sessionId: string;
      skillLogId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const row = await skillsService.getById({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      skillLogId: params.skillLogId,
    });
    if (!row) throw new AppError.NotFound("Skill log not found");

    return NextResponse.json(row);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      sessionId: string;
      skillLogId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));

    const updated = await skillsService.update({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      skillLogId: params.skillLogId,
      sessionBlockId:
        body.sessionBlockId === undefined ? undefined : body.sessionBlockId,
      exerciseId: body.exerciseId === undefined ? undefined : body.exerciseId,
      attempts: body.attempts === undefined ? undefined : body.attempts,
      successes: body.successes === undefined ? undefined : body.successes,
      qualityScore:
        body.qualityScore === undefined || body.qualityScore === null
          ? (undefined as any)
          : Number(body.qualityScore),
      notes: body.notes === undefined ? undefined : body.notes,
    });

    return NextResponse.json(updated);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      sessionId: string;
      skillLogId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    await skillsService.delete({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      skillLogId: params.skillLogId,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
