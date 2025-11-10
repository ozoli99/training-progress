import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { json } from "@/lib/api";
import { equipmentService } from "@/features/equipment/service";

export const GET = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { equipmentId } = ctx.params as { equipmentId: string };

    const item = await equipmentService.get({
      orgId: orgId!,
      equipmentId,
    });

    if (!item) return json.err("Not found", 404);
    return json.ok(item, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const PATCH = withApiAuth(
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { equipmentId } = ctx.params as { equipmentId: string };
    const body = await req.json().catch(() => ({}));

    const updated = await equipmentService.update({
      orgId: orgId!,
      equipmentId,
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
  async (req: AuthedRequest, ctx) => {
    const { orgId } = req.authCtx;
    const { equipmentId } = ctx.params as { equipmentId: string };

    await equipmentService.delete({
      orgId: orgId!,
      equipmentId,
    });

    return new Response(null, { status: 204 });
  },
  { scope: "org", minRole: "org:coach" }
);
