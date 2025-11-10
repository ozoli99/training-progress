import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { skillsService } from "@/features/skills/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const sp = req.nextUrl.searchParams;
    const exerciseId = sp.get("exerciseId") ?? undefined;

    const minQualityScore = sp.get("minQualityScore");
    const maxQualityScore = sp.get("maxQualityScore");

    const data = await skillsService.list({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      exerciseId,
      minQualityScore:
        minQualityScore === null ? undefined : Number(minQualityScore),
      maxQualityScore:
        maxQualityScore === null ? undefined : Number(maxQualityScore),
    });

    return NextResponse.json(data);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));
    const created = await skillsService.create({
      orgId: params.orgId,
      athleteId: params.athleteId,
      sessionId: params.sessionId,
      sessionBlockId: body.sessionBlockId ?? null,
      exerciseId: body.exerciseId ?? null,
      attempts: body.attempts ?? null,
      successes: body.successes ?? null,
      qualityScore:
        body.qualityScore === undefined || body.qualityScore === null
          ? null
          : Number(body.qualityScore),
      notes: body.notes ?? null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
