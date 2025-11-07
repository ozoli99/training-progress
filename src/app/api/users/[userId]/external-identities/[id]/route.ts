import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import { usersService } from "@/features/users/service";
import type { AuthedRequest } from "@/features/auth/types";
import { z } from "zod";

const Params = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

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
