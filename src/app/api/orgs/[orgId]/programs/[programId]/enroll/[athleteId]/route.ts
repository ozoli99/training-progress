import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { programsService } from "@/features/programs/service";

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; programId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const { startDate } = (await req.json().catch(() => ({}))) as {
      startDate?: string;
    };
    const data = await programsService.enroll({
      orgId: ctx.orgId!,
      programId: params.programId,
      athleteId: params.athleteId,
      startDate,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: { orgId: string; programId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await programsService.unenroll({
      orgId: ctx.orgId!,
      programId: params.programId,
      athleteId: params.athleteId,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
