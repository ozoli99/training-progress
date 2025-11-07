import { withApiAuth } from "@/features/auth/guard";
import { orgsService } from "@/features/orgs/service";
import { NextResponse } from "next/server";

export const PUT = withApiAuth(
  async (req, { params }) => {
    const body = await req.json().catch(() => ({}));
    await orgsService.changeMemberRole({
      orgId: params.orgId,
      userId: params.userId,
      role: body.role,
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  },
  { scope: "org", minRole: "org:admin" }
);

export const DELETE = withApiAuth(
  async (_req, { params }) => {
    await orgsService.removeMember({
      orgId: params.orgId,
      userId: params.userId,
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  },
  { scope: "org", minRole: "org:admin" }
);
