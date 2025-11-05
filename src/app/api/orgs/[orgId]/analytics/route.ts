import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/features/analytics/service";

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 27);
  const fmt = (date: Date) => date.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? defaultRange().from;
    const to = searchParams.get("to") ?? defaultRange().to;

    const data = await analyticsService.getDashboardKpis({
      orgId: params.orgId,
      range: { from, to },
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
