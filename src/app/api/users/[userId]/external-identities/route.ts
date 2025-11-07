import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import { usersService } from "@/features/users/service";
import type { AuthedRequest } from "@/features/auth/types";
import { z } from "zod";

const Params = z.object({ userId: z.string().uuid() });
const CreateBody = z.object({
  provider: z.string().min(1),
  externalUserId: z.string().min(1),
  credentials: z.unknown().optional(),
});

export const GET = withApiAuth(
  async (req: AuthedRequest, ctx: { params: { userId: string } }) => {
    const { userId } = Params.parse(ctx.params);
    const items = await usersService.listExternalIdentities({ userId });
    return json.ok({ items }, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const POST = withApiAuth(
  async (req: AuthedRequest, ctx: { params: { userId: string } }) => {
    const { userId } = Params.parse(ctx.params);
    const body = await req.json().catch(() => ({}));
    const input = CreateBody.parse(body);
    const created = await usersService.createExternalIdentity({
      userId,
      ...input,
    });
    return json.ok(created, 201);
  },
  { scope: "org", minRole: "org:admin" }
);
