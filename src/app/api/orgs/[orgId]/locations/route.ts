import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import type { AuthedRequest } from "@/features/auth/types";
import { trainingLocationsService } from "@/features/training-locations/service";

export const GET = withApiAuth(
  async (req: AuthedRequest) => {
    const { orgId } = req.authCtx;
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const items = await trainingLocationsService.list({
      orgId: orgId!,
      q,
      includeInactive,
    });
    return json.ok(items, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const POST = withApiAuth(
  async (req: AuthedRequest) => {
    const { orgId } = req.authCtx;
    const body = await req.json().catch(() => ({}));
    const created = await trainingLocationsService.create({
      orgId: orgId!,
      name: body.name,
      type: body.type ?? null,
      address: body.address ?? null,
      isActive: body.isActive ?? true,
    });
    return json.ok(created, 201);
  },
  { scope: "org", minRole: "org:coach" }
);
