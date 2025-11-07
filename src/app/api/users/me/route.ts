import { withApiAuth } from "@/features/auth/guard";
import { json } from "@/lib/api";
import { usersService } from "@/features/users/service";
import type { AuthedRequest } from "@/features/auth/types";

export const GET = withApiAuth(
  async (req: AuthedRequest) => {
    const { userId } = req.authCtx;
    const me = await usersService.get({ userId: userId! });
    if (!me) return json.err("User not found", 404);
    return json.ok(me, 200);
  },
  { scope: "user" }
);
