import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { athleteMeasurementsService } from "@/features/athlete-measurements/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const sp = req.nextUrl.searchParams;
    const from = sp.get("from") ?? undefined;
    const to = sp.get("to") ?? undefined;
    const typesCsv = sp.get("types") ?? undefined;
    const types =
      typesCsv
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? undefined;
    const limit = sp.get("limit") ? Number(sp.get("limit")) : 50;
    const offset = sp.get("offset") ? Number(sp.get("offset")) : 0;
    const order = (sp.get("order") === "asc" ? "asc" : "desc") as
      | "asc"
      | "desc";

    const rows = await athleteMeasurementsService.list({
      orgId: params.orgId,
      athleteId: params.athleteId,
      from,
      to,
      types,
      limit,
      offset,
      order,
    });

    return NextResponse.json(rows, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));
    const created = await athleteMeasurementsService.create({
      orgId: params.orgId,
      athleteId: params.athleteId,
      ...body,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
