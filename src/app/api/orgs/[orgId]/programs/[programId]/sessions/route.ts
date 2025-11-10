import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { programsService } from "@/features/programs/service";
import type {
  TListSessionsInput,
  TCreateSessionInput,
  TPatchSessionInput,
  TDeleteSessionInput,
} from "@/features/programs/dto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const { searchParams } = new URL(req.url);
    const programBlockId = searchParams.get("programBlockId") ?? undefined;

    const data = await programsService.listSessions({
      orgId: ctx.orgId!,
      programId: params.programId,
      programBlockId,
    } as TListSessionsInput);

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
      TCreateSessionInput,
      "orgId" | "programId"
    >;
    const data = await programsService.createSession({
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = (await req.json().catch(() => ({}))) as Omit<
      TPatchSessionInput,
      "orgId" | "programId"
    >;
    const data = await programsService.updateSession({
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
  req: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = (await req.json().catch(() => ({}))) as Omit<
      TDeleteSessionInput,
      "orgId" | "programId"
    >;
    await programsService.deleteSession({
      orgId: ctx.orgId!,
      programId: params.programId,
      ...body,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
