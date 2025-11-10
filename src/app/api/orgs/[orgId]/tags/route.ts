import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { tagsService } from "@/features/tags/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q") ?? undefined;
    const kind = sp.get("kind") ?? undefined;
    const isActiveStr = sp.get("isActive");
    const isActive =
      isActiveStr == null
        ? undefined
        : isActiveStr === "true"
          ? true
          : isActiveStr === "false"
            ? false
            : undefined;

    const limit = Number(sp.get("limit") ?? "50");
    const offset = Number(sp.get("offset") ?? "0");
    const orderBy = (sp.get("orderBy") as "name" | "createdAt") ?? "name";
    const order = (sp.get("order") as "asc" | "desc") ?? "asc";

    const data = await tagsService.list({
      orgId: params.orgId,
      q,
      kind,
      isActive,
      limit,
      offset,
      orderBy,
      order,
    });

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

    const body = await req.json().catch(() => ({}));
    const data = await tagsService.create({
      orgId: params.orgId,
      name: body?.name,
      kind: body?.kind,
      isActive: body?.isActive,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
