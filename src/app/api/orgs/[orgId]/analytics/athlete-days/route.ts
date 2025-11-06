import { NextResponse, type NextRequest } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import type { OrgRole } from "@/features/auth/utils";
import { analyticsService } from "@/features/analytics/service";
import { parseDateRange } from "@/lib/api";

const ADMIN: OrgRole = "org:admin";
const VIEWER: OrgRole = "org:viewer";

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 27);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export const GET = withApiAuth(
  async (req: NextRequest, { params }: { params: { orgId: string } }) => {
    const url = new URL(req.url);
    const athleteId = url.searchParams.get("athleteId") ?? undefined;
    const range = { ...defaultRange(), ...parseDateRange(req.url) };

    const series = await analyticsService.getAthleteTrend({
      orgId: params.orgId,
      athleteId,
      range,
    });
    return NextResponse.json(series);
  },
  { scope: "org", minRole: VIEWER }
);

export const POST = withApiAuth(
  async (req: NextRequest, { params }: { params: { orgId: string } }) => {
    const body = await req.json().catch(() => ({}));
    const { day, athleteId } = body as { day?: string; athleteId?: string };

    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return NextResponse.json(
        { error: "day must be YYYY-MM-DD" },
        { status: 400 }
      );
    }

    await analyticsService.recomputeDaily({
      orgId: params.orgId,
      day,
      athleteId,
    });
    return NextResponse.json({ ok: true });
  },
  { scope: "org", minRole: ADMIN }
);
