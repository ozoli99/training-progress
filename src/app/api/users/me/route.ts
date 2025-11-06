import { NextResponse } from "next/server";
import { withApiAuth } from "@/features/auth/guard";

export const GET = withApiAuth(
  async (req) => {
    const { userId } = req.authCtx;
    return NextResponse.json({ userId });
  },
  { scope: "user" }
);
