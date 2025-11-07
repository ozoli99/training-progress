import { withApiAuth } from "@/features/auth/guard";
import { orgsService } from "@/features/orgs/service";
import { NextResponse } from "next/server";

export const PUT = withApiAuth(
  async (req, { params }) => {
    const body = await req.json().catch(() => ({}));
    const updated = await orgsService.setOrgSettings({
      orgId: params.orgId,
      ...body,
    });
    return NextResponse.json(updated, { status: 200 });
  },
  { scope: "org", minRole: "org:admin" }
);
