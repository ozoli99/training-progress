import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { json } from "@/lib/api";
import { z } from "zod";
import { exercisesService } from "@/features/exercises/service";

const Params = z.object({
  orgId: z.string().uuid(),
});

const ListQuery = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  modality: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const CreateBody = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().optional(),
  modality: z.string().optional(),
  globalExerciseId: z.string().uuid().optional(),
});

export const GET = withApiAuth(
  async (req: AuthedRequest, ctx: { params: { orgId: string } }) => {
    const { orgId } = Params.parse(ctx.params);

    const url = new URL(req.url);
    const query = ListQuery.parse({
      search: url.searchParams.get("search") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      modality: url.searchParams.get("modality") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });

    const items = await exercisesService.list({
      orgId,
      search: query.search,
      category: query.category,
      modality: query.modality,
      limit: query.limit,
      offset: query.offset,
    });

    return json.ok(items, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const POST = withApiAuth(
  async (req: AuthedRequest, ctx: { params: { orgId: string } }) => {
    const { orgId } = Params.parse(ctx.params);
    const body = await req.json().catch(() => ({}));
    const data = CreateBody.parse({ ...body, orgId });

    const row = await exercisesService.create(data);
    return json.ok(row, 201);
  },
  { scope: "org", minRole: "org:coach" }
);
