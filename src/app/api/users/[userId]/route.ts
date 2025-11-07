import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import { usersService } from "@/features/users/service";
import type { AuthedRequest } from "@/features/auth/types";
import { z } from "zod";

const Params = z.object({ userId: z.string().uuid() });
const UpdateBody = z.object({
  email: z.string().email().optional(),
  fullName: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const GET = withApiAuth(
  async (req: AuthedRequest, ctx: { params: { userId: string } }) => {
    const { userId } = Params.parse(ctx.params);
    const row = await usersService.get({ userId });
    if (!row) return json.err("User not found", 404);
    return json.ok(row, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const PUT = withApiAuth(
  async (req: AuthedRequest, ctx: { params: { userId: string } }) => {
    const { userId } = Params.parse(ctx.params);
    const body = await req.json().catch(() => ({}));
    const input = UpdateBody.parse(body);
    const updated = await usersService.update({ userId, ...input });
    return json.ok(updated, 200);
  },
  { scope: "org", minRole: "org:admin" }
);

export const DELETE = withApiAuth(
  async (req: AuthedRequest, ctx: { params: { userId: string } }) => {
    const { userId } = Params.parse(ctx.params);
    await usersService.delete({ userId });
    return json.ok({}, 204);
  },
  { scope: "org", minRole: "org:admin" }
);
