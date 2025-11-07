import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import { athletesService } from "@/features/athletes/service";
import type { AuthedRequest } from "@/features/auth/types";

export const GET = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { athleteId } = ctx.params as { athleteId: string };
    const items = await athletesService.listVisibility({
      orgId: orgId!,
      athleteId,
    });
    return json.ok(items, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const POST = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { athleteId } = ctx.params as { athleteId: string };
    const body = await req.json().catch(() => ({}));
    const row = await athletesService.setVisibility({
      orgId: orgId!,
      athleteId,
      userId: body.userId,
      canView: body.canView,
      canLog: body.canLog,
      canViewCoachNotes: body.canViewCoachNotes,
    });
    return json.ok(row, 200);
  },
  { scope: "org", minRole: "org:coach" }
);
