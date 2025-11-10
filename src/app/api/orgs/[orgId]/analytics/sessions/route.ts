import { NextResponse, type NextRequest } from "next/server";
import { withApiAuth } from "@/features/auth/guard";
import { parseDateRange, parsePagination } from "@/lib/api";
import { analyticsService } from "@/features/analytics/service";
import { orgsService } from "@/features/orgs/service";

export const GET = withApiAuth(
  async (
    req: NextRequest | Request,
    { params }: { params: { orgId: string } }
  ) => {
    // Resolve UUID from either UUID or Clerk org id in the URL
    const orgRow = await orgsService.resolveOrgByAnyId({
      orgIdOrClerkId: params.orgId,
    });
    if (!orgRow) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    const range = parseDateRange(req);
    const { limit, offset } = parsePagination(req, {
      maxLimit: 100,
      defLimit: 50,
    });

    const data = await analyticsService.getSessions({
      orgId: orgRow.id, // <-- use UUID
      range,
      limit,
      offset,
    });

    return NextResponse.json(data);
  },
  { scope: "org", minRole: "org:viewer" }
);
