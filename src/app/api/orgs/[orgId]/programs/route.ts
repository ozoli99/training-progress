import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { programsService } from "@/features/programs/service";
import type {
  TListProgramsInput,
  TCreateProgramInput,
} from "@/features/programs/dto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;
    const offset = searchParams.get("offset")
      ? Number(searchParams.get("offset"))
      : undefined;

    const data = await programsService.list({
      orgId: ctx.orgId!,
      q,
      limit,
      offset,
    } as TListProgramsInput);

    return NextResponse.json(data);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = (await req.json().catch(() => ({}))) as Omit<
      TCreateProgramInput,
      "orgId"
    >;
    const data = await programsService.create({ orgId: ctx.orgId!, ...body });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
