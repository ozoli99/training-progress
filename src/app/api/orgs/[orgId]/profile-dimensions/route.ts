import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { profileDimensionsService } from "@/features/profile-dimensions/service";

function boolParam(v: string | null): boolean | undefined {
  if (v == null) return undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");
    const orderBy = url.searchParams.get("orderBy") as
      | "id"
      | "key"
      | "label"
      | "displayOrder"
      | "isDefault"
      | "isActive"
      | null;
    const order = url.searchParams.get("order") as "asc" | "desc" | null;
    const activeOnly = boolParam(url.searchParams.get("activeOnly"));

    const rows = await profileDimensionsService.list({
      orgId: ctx.orgId!,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      orderBy: orderBy ?? undefined,
      order: order ?? undefined,
      activeOnly,
    });

    return NextResponse.json(rows);
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
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));

    const created = await profileDimensionsService.create({
      orgId: ctx.orgId!,
      key: body.key,
      label: body.label,
      description: body.description,
      isDefault: body.isDefault,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
