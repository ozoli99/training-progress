import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { profileDimensionsService } from "@/features/profile-dimensions/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; id: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const row = await profileDimensionsService.get({
      orgId: ctx.orgId!,
      id: params.id,
    });
    if (!row) throw new AppError.NotFound("Profile dimension not found");
    return NextResponse.json(row);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; id: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));

    const updated = await profileDimensionsService.update({
      orgId: ctx.orgId!,
      id: params.id,
      key: body.key,
      label: body.label,
      description: body.description,
      isDefault: body.isDefault,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
    });

    return NextResponse.json(updated);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; id: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    await profileDimensionsService.delete({
      orgId: ctx.orgId!,
      id: params.id,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
