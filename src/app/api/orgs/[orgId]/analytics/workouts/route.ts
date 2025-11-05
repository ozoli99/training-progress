import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/features/analytics/service";

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 27);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ?? defaultRange().from;
    const to = searchParams.get("to") ?? defaultRange().to;

    const rows = await analyticsService.getWorkoutBreakdown({
      orgId: params.orgId,
      range: { from, to },
    });

    return NextResponse.json({ rows }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  _ctx: { params: { orgId: string } }
) {
  try {
    const body = await req.json();
    await analyticsService.recomputeForWorkoutLog(body);
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
