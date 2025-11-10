// api/lookups/entity-kinds/route.ts
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { getAuthContext } from "@/features/auth/context";
import { json } from "@/lib/api";
import { lookupsService } from "@/features/lookups/service";
import { z } from "zod";

const Query = z.object({
  activeOnly: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => (typeof v === "string" ? v === "true" : !!v)),
});

const CreateBody = z.object({
  code: z.string().min(1),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const UpdateBody = z.object({
  code: z.string().min(1),
  patch: z.object({
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

const DeleteBody = z.object({ code: z.string().min(1) });

export const GET = withApiAuth(
  async (req: AuthedRequest) => {
    const { searchParams } = new URL(req.url);
    const parsed = Query.parse(Object.fromEntries(searchParams.entries()));

    const ctx = await getAuthContext(); // <- read org/user from auth context
    const items = await lookupsService.listEntityKinds({
      orgId: ctx.orgId,
      activeOnly: parsed.activeOnly,
    });

    return json.ok({ items }, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const POST = withApiAuth(
  async (req: AuthedRequest) => {
    const body = await req.json().catch(() => ({}));
    const input = CreateBody.parse(body);

    const ctx = await getAuthContext();
    const created = await lookupsService.createEntityKind({
      orgId: ctx.orgId,
      ...input,
    });

    return json.ok(created, 201);
  },
  { scope: "org", minRole: "org:admin" }
);

export const PATCH = withApiAuth(
  async (req: AuthedRequest) => {
    const body = await req.json().catch(() => ({}));
    const input = UpdateBody.parse(body);
    const updated = await lookupsService.updateEntityKind(input);
    return json.ok(updated, 200);
  },
  { scope: "org", minRole: "org:admin" }
);

export const DELETE = withApiAuth(
  async (req: AuthedRequest) => {
    const body = await req.json().catch(() => ({}));
    const input = DeleteBody.parse(body);
    await lookupsService.deleteEntityKind(input);
    return json.ok({}, 204);
  },
  { scope: "org", minRole: "org:admin" }
);
