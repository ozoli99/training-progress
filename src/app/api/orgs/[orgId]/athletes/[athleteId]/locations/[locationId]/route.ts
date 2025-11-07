import { withApiAuth } from "@/features/auth/guard";
import { athletesService } from "@/features/athletes/service";
import type { AuthedRequest } from "@/features/auth/types";

export const PUT = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { athleteId, trainingLocationId } = ctx.params as {
      athleteId: string;
      trainingLocationId: string;
    };
    await athletesService.setDefaultLocation({
      orgId: orgId!,
      athleteId,
      trainingLocationId,
    });
    return new Response(null, { status: 204 });
  },
  { scope: "org", minRole: "org:coach" }
);

export const DELETE = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { athleteId, trainingLocationId } = ctx.params as {
      athleteId: string;
      trainingLocationId: string;
    };
    await athletesService.unlinkLocation({
      orgId: orgId!,
      athleteId,
      trainingLocationId,
    });
    return new Response(null, { status: 204 });
  },
  { scope: "org", minRole: "org:coach" }
);
