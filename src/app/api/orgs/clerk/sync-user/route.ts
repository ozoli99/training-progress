import { withApiAuth } from "@/features/auth/guard";
import { orgsService } from "@/features/orgs/service";
import { NextResponse } from "next/server";

export const POST = withApiAuth(
  async (req) => {
    const body = await req.json().catch(() => ({}));
    const userId = await orgsService.ensureUserAccount(body);
    return NextResponse.json({ userId }, { status: 200 });
  },
  { scope: "user" }
);
