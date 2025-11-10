import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import type { AuthedRequest } from "@/features/auth/types";
import { trainingLocationsService } from "@/features/training-locations/service";

export const PATCH = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { tleId } = ctx.params as { tleId: string };
    const body = await req.json().catch(() => ({}));
    const updated = await trainingLocationsService.updateEquipment({
      equipmentId: tleId,
      name: body.name,
      variant: body.variant,
      specs: body.specs,
      isActive: body.isActive,
    });
    return json.ok(updated, 200);
  },
  { scope: "org", minRole: "org:coach" }
);

export const DELETE = withApiAuth(
  async (_req: AuthedRequest, ctx) => {
    const { tleId } = ctx.params as { tleId: string };
    await trainingLocationsService.removeEquipment({ equipmentId: tleId });
    return new Response(null, { status: 204 });
  },
  { scope: "org", minRole: "org:coach" }
);
