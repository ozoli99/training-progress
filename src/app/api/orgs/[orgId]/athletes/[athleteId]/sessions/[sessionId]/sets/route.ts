import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { setLogsService } from "@/features/set-logs/service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    const data = await setLogsService.list({
      ...params,
      ...query,
    });

    return NextResponse.json({ items: data }, { status: 200 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; sessionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));
    const created = await setLogsService.create({
      ...params,
      ...body,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
