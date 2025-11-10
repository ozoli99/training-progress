import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import type { AuthedRequest } from "@/features/auth/types";
import { trainingLocationsService } from "@/features/training-locations/service";

export const GET = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { locationId } = ctx.params as { locationId: string };
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const items = await trainingLocationsService.listEquipment({
      trainingLocationId: locationId,
      includeInactive,
    });
    return json.ok(items, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const POST = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { locationId } = ctx.params as { locationId: string };
    const body = await req.json().catch(() => ({}));
    const created = await trainingLocationsService.addEquipment({
      trainingLocationId: locationId,
      name: body.name,
      variant: body.variant ?? null,
      specs: body.specs,
      isActive: body.isActive ?? true,
    });
    return json.ok(created, 201);
  },
  { scope: "org", minRole: "org:coach" }
);
