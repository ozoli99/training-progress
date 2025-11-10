import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { athleteProfilesService } from "@/features/athlete-profile/service";

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

    const { searchParams } = new URL(req.url);
    const athleteProfileId = searchParams.get("athleteProfileId");
    if (!athleteProfileId) {
      throw new AppError.BadRequest("Missing athleteProfileId.");
    }

    const rows = await athleteProfilesService.listMetrics({
      orgId: params.orgId,
      athleteProfileId,
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

    const row = await athleteProfilesService.setMetric({
      orgId: params.orgId,
      athleteId: params.athleteId,
      ...body,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
