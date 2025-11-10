import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { programsService } from "@/features/programs/service";
import type {
  TListBlocksInput,
  TCreateBlockInput,
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

    const data = await programsService.listBlocks({
      orgId: ctx.orgId!,
      programId: params.programId,
    } as TListBlocksInput);

    return NextResponse.json(data);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = (await req.json().catch(() => ({}))) as Omit<
      TCreateBlockInput,
      "orgId" | "programId"
    >;
    const data = await programsService.createBlock({
      orgId: ctx.orgId!,
      programId: params.programId,
      ...body,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
