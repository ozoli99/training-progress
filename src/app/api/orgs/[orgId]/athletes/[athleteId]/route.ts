import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import { athletesService } from "@/features/athletes/service";
import type { AuthedRequest } from "@/features/auth/types";

export const GET = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { athleteId } = ctx.params as { athleteId: string };
    const row = await athletesService.get({ orgId: orgId!, athleteId });
    return row ? json.ok(row, 200) : json.err("Not Found", 404);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const PUT = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { athleteId } = ctx.params as { athleteId: string };
    const body = await req.json().catch(() => ({}));
    const updated = await athletesService.update({
      orgId: orgId!,
      athleteId,
      displayName: body.displayName,
      email: body.email,
    });
    return json.ok(updated, 200);
  },
  { scope: "org", minRole: "org:coach" }
);

export const DELETE = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { athleteId } = ctx.params as { athleteId: string };
    await athletesService.delete({ orgId: orgId!, athleteId });
    return new Response(null, { status: 204 });
  },
  { scope: "org", minRole: "org:admin" }
);
