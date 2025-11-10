import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { json } from "@/lib/api";
import { equipmentService } from "@/features/equipment/service";

export const GET = withApiAuth(
  async (req: AuthedRequest) => {
    const { orgId } = req.authCtx;

    const q = req.nextUrl.searchParams.get("q") || undefined;
    const includeInactive =
      req.nextUrl.searchParams.get("includeInactive") === "true";

    const items = await equipmentService.list({
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

    const created = await equipmentService.create({
      orgId: orgId!,
      name: body.name,
      variant: body.variant ?? null,
      specs: body.specs,
      isActive: body.isActive ?? true,
    });

    return json.ok(created, 201);
  },
  { scope: "org", minRole: "org:coach" }
);
