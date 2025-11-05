import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/features/analytics/service";

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const body = await req.json();
    await analyticsService.recomputeDaily({
      orgId: params.orgId,
      ...body,
    });
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
