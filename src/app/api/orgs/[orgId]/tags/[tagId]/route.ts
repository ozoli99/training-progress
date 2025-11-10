import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { tagsService } from "@/features/tags/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; tagId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const tag = await tagsService.getById({
      orgId: params.orgId,
      tagId: params.tagId,
    });
    if (!tag) throw new AppError.NotFound("Tag not found");

    return NextResponse.json(tag);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; tagId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = await req.json().catch(() => ({}));
    const updated = await tagsService.update({
      orgId: params.orgId,
      tagId: params.tagId,
      name: body?.name,
      kind: body?.kind,
      isActive: body?.isActive,
    });

    return NextResponse.json(updated);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; tagId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    await tagsService.delete({ orgId: params.orgId, tagId: params.tagId });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
