// src/app/api/orgs/[orgId]/me/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";

const Params = z.object({ orgId: z.string() });

type AppRole = "owner" | "admin" | "coach" | "athlete" | null;

/** Minimal robust mapping from Clerk membership.role → your app role */
function mapClerkRoleToApp(role: string | null | undefined): AppRole {
  // Adjust to your Clerk roles. Common Clerk roles: "admin" | "basic_member"
  // If you defined custom roles ("coach", "athlete"), they’ll come through as such.
  switch (role) {
    case "owner":
      return "owner";
    case "admin":
    case "org:admin":
      return "admin"; // or "owner" if you want to treat admin == owner
    case "coach":
    case "org:coach":
      return "coach";
    case "athlete":
    case "org:athlete":
      return "athlete";
    case "member":
    case "basic_member":
    case "viewer":
    case "org:viewer":
    default:
      // If plain members should be athletes in your app, return "athlete" here.
      return "athlete";
  }
}

export async function GET(_req: Request, ctx: { params: { orgId: string } }) {
  try {
    const { orgId } = Params.parse(ctx.params);

    // NOTE: auth() is async in your environment
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // NOTE: clerkClient is a function → await it, then use .organizations
    const cc = await clerkClient();

    // Verify membership in the org from the URL (don’t rely on "active org")
    const memberships = await cc.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });

    const mine = memberships.data.find((m) => {
      const memberUserId =
        m.publicUserData?.userId ?? (m as any).userId ?? null;
      return memberUserId === userId;
    });
    if (!mine) {
      return NextResponse.json(
        { role: null, athleteId: null },
        { status: 200 }
      );
    }

    const appRole = mapClerkRoleToApp(mine.role);

    // If you can resolve athleteId from your DB, do it here
    const athleteId: string | null = null;

    return NextResponse.json({ role: appRole, athleteId }, { status: 200 });
  } catch (e) {
    console.error("[orgs/me] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
