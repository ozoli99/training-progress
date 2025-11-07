import { withApiAuth } from "@/features/auth/guard";
import { orgsService } from "@/features/orgs/service";
import { NextResponse } from "next/server";

export const GET = withApiAuth(
  async (req) => {
    const { userId } = req.authCtx;
    const rows = await orgsService.listUserOrgs({ userId });
    return NextResponse.json(rows, { status: 200 });
  },
  { scope: "user" }
);

export const POST = withApiAuth(
  async (req) => {
    const { userId } = req.authCtx;
    const body = await req.json().catch(() => ({}));
    const created = await orgsService.createOrg({
      ownerUserId: userId,
      ...body,
    });
    return NextResponse.json(created, { status: 201 });
  },
  { scope: "user" }
);
