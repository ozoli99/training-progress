import { withApiAuth } from "@/features/auth/guard";
import { orgsService } from "@/features/orgs/service";
import { NextResponse } from "next/server";

export const GET = withApiAuth(
  async (_req, { params }) => {
    const res = await orgsService.getMembers({ orgId: params.orgId });
    return NextResponse.json(res, { status: 200 });
  },
  { scope: "org" }
);

export const POST = withApiAuth(
  async (req, { params }) => {
    const body = await req.json().catch(() => ({}));
    await orgsService.addMember({
      orgId: params.orgId,
      ...body,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  },
  { scope: "org", minRole: "org:admin" }
);
