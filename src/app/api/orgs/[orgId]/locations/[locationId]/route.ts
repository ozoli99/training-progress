import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import type { AuthedRequest } from "@/features/auth/types";
import { trainingLocationsService } from "@/features/training-locations/service";

export const GET = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { locationId } = ctx.params as { locationId: string };
    const item = await trainingLocationsService.get({
      orgId: orgId!,
      locationId,
    });
    if (!item) return json.err("Not found", 404);
    return json.ok(item, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const PATCH = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { locationId } = ctx.params as { locationId: string };
    const body = await req.json().catch(() => ({}));
    const updated = await trainingLocationsService.update({
      orgId: orgId!,
      locationId,
      name: body.name,
      type: body.type,
      address: body.address,
      isActive: body.isActive,
    });
    return json.ok(updated, 200);
  },
  { scope: "org", minRole: "org:coach" }
);
