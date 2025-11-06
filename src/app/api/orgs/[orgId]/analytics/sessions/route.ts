import { NextResponse, type NextRequest } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import { parseDateRange } from "@/lib/api";
import { analyticsService } from "@/features/analytics/service";

function parsePagination(url: string) {
  const sp = new URL(url).searchParams;
  return {
    limit: Number(sp.get("limit") ?? 50),
    offset: Number(sp.get("offset") ?? 0),
  };
}

export const GET = withApiAuth(
  async (req: NextRequest, { params }: { params: { orgId: string } }) => {
    const range = parseDateRange(req.url);
    const { limit, offset } = parsePagination(req.url);

    const data = await analyticsService.getSessions({
      orgId: params.orgId,
      range,
      limit,
      offset,
    });

    return NextResponse.json(data);
  },
  { scope: "org", minRole: "org:viewer" }
);
