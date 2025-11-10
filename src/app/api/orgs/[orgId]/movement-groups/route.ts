import { NextRequest, NextResponse } from "next/server";
import { handleApiError, AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { movementGroupsService } from "@/features/movement-groups/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam == null ? undefined : isActiveParam === "true";

    const limit = Number(searchParams.get("limit") ?? "50");
    const offset = Number(searchParams.get("offset") ?? "0");
    const orderBy =
      (searchParams.get("orderBy") as "name" | "id" | null) ?? "name";
    const order = (searchParams.get("order") as "asc" | "desc" | null) ?? "asc";

    const rows = await movementGroupsService.list({
      orgId: params.orgId,
      q,
      isActive,
      limit,
      offset,
      orderBy,
      order,
    });

    return NextResponse.json(rows, { status: 200 });
  } catch (e: unknown) {
    return handleApiError(e);
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
    const created = await movementGroupsService.create({
      orgId: params.orgId,
      name: body.name,
      description: body.description ?? null,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    return handleApiError(e);
  }
}
