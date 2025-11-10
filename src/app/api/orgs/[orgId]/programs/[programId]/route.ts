import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { programsService } from "@/features/programs/service";
import type {
  TPatchProgramInput,
  TDeleteProgramInput,
  TGetProgramInput,
} from "@/features/programs/dto";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");
    const data = await programsService.getById({
      orgId: ctx.orgId!,
      programId: params.programId,
    } as TGetProgramInput);
    return NextResponse.json(data);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");
    const body = (await req.json().catch(() => ({}))) as Omit<
      TPatchProgramInput,
      "orgId" | "programId"
    >;
    const data = await programsService.update({
      orgId: ctx.orgId!,
      programId: params.programId,
      ...body,
    });
    return NextResponse.json(data);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");
    await programsService.delete({
      orgId: ctx.orgId!,
      programId: params.programId,
    } as TDeleteProgramInput);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
