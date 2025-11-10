import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { programsService } from "@/features/programs/service";
import type {
  TPatchBlockInput,
  TDeleteBlockInput,
} from "@/features/programs/dto";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; programId: string; blockId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = (await req.json().catch(() => ({}))) as Omit<
      TPatchBlockInput,
      "orgId" | "programId" | "blockId"
    >;
    const data = await programsService.updateBlock({
      orgId: ctx.orgId!,
      programId: params.programId,
      blockId: params.blockId,
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
  { params }: { params: { orgId: string; programId: string; blockId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await programsService.deleteBlock({
      orgId: ctx.orgId!,
      programId: params.programId,
      blockId: params.blockId,
    } as TDeleteBlockInput);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
