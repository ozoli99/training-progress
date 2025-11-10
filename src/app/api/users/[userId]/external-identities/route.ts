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

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") || undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam === null ? null : cursorParam; // allow null

    const page = await usersService.listExternalIdentities({
      userId,
      provider,
      limit,
      cursor,
    });

    // Must be: { items, nextCursor }
    return json.ok(page, 200);
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
