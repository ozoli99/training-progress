import { NextResponse, type NextRequest } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { OrgRole } from "@/features/auth/utils";
import { analyticsService } from "@/features/analytics/service";
import { parseDateRange } from "@/lib/api";

const VIEWER: OrgRole = "org:viewer";

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 27);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export const GET = withApiAuth(
  async (
    req: NextRequest,
    { params }: { params: { orgId: string; athleteId: string } }
  ) => {
    const range = { ...defaultRange(), ...parseDateRange(req.url) };
    const series = await analyticsService.getAthleteTrend({
      orgId: params.orgId,
      athleteId: params.athleteId,
      range,
    });
    return NextResponse.json(series);
  },
  { scope: "org", minRole: VIEWER }
);
