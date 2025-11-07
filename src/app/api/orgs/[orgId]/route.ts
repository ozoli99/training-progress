import { withApiAuth } from "@/features/auth/guard";
import { orgsService } from "@/features/orgs/service";
import { NextResponse } from "next/server";

export const GET = withApiAuth(
  async (_req, { params }) => {
    const data = await orgsService.getOrgWithSettings({ orgId: params.orgId });
    return NextResponse.json(data, { status: data ? 200 : 404 });
  },
  { scope: "org" }
);
