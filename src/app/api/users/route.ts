import { withApiAuth } from "@/features/auth/guard";
import { json, parsePagination } from "@/lib/api";
import { usersService } from "@/features/users/service";
import type { AuthedRequest } from "@/features/auth/types";
import { z } from "zod";

const ListQuery = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const GET = withApiAuth(
  async (req: AuthedRequest) => {
    const { orgId } = req.authCtx;
    const url = new URL(req.url);
    const qp = ListQuery.safeParse(Object.fromEntries(url.searchParams));
    const { limit, offset } = parsePagination(req.url);
    const params = {
      orgId: orgId!,
      search: qp.success ? qp.data.search : undefined,
      limit,
      offset,
    };
    const rows = await usersService.list(params);
    return json.ok(rows, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

const CreateBody = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  clerkUserId: z.string().optional(),
});

export const POST = withApiAuth(
  async (req: AuthedRequest) => {
    const body = await req.json().catch(() => ({}));
    const input = CreateBody.parse(body);
    const created = await usersService.create(input);
    return json.ok(created, 201);
  },
  { scope: "org", minRole: "org:admin" }
);
