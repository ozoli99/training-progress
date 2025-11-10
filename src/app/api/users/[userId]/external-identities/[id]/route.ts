import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import { usersService } from "@/features/users/service";
import type { AuthedRequest } from "@/features/auth/types";
import { z } from "zod";

const Params = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

const PatchBody = z.object({
  credentials: z.unknown().optional(),
});

export const GET = withApiAuth(
  async (
    req: AuthedRequest,
    ctx: { params: { userId: string; id: string } }
  ) => {
    const { userId, id } = Params.parse(ctx.params);
    const item = await usersService.getExternalIdentity({ userId, id });
    return json.ok(item, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const PATCH = withApiAuth(
  async (
    req: AuthedRequest,
    ctx: { params: { userId: string; id: string } }
  ) => {
    const { userId, id } = Params.parse(ctx.params);
    const body = await req.json().catch(() => ({}));
    const input = PatchBody.parse(body);

    const updated = await usersService.updateExternalIdentity({
      userId,
      id,
      credentials: input.credentials,
    });

    return json.ok(updated, 200);
  },
  { scope: "org", minRole: "org:admin" }
);

export const DELETE = withApiAuth(
  async (
    req: AuthedRequest,
    ctx: { params: { userId: string; id: string } }
  ) => {
    const { userId, id } = Params.parse(ctx.params);
    await usersService.deleteExternalIdentity({ userId, id });
    return json.ok({}, 204);
  },
  { scope: "org", minRole: "org:admin" }
);
