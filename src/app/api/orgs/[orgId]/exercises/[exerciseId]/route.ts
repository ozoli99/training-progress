import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { json } from "@/lib/api";
import { z } from "zod";
import { exercisesService } from "@/features/exercises/service";

const Params = z.object({
  orgId: z.string().uuid(),
  exerciseId: z.string().uuid(),
});

const UpdateBody = z.object({
  orgId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  name: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  modality: z.string().nullable().optional(),
  globalExerciseId: z.string().uuid().nullable().optional(),
});

export const GET = withApiAuth(
  async (
    req: AuthedRequest,
    ctx: { params: { orgId: string; exerciseId: string } }
  ) => {
    const { orgId, exerciseId } = Params.parse(ctx.params);
    const row = await exercisesService.get({ orgId, exerciseId });
    if (!row) return json.err("Exercise not found", 404);
    return json.ok(row, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const PUT = withApiAuth(
  async (
    req: AuthedRequest,
    ctx: { params: { orgId: string; exerciseId: string } }
  ) => {
    const { orgId, exerciseId } = Params.parse(ctx.params);
    const body = await req.json().catch(() => ({}));
    const input = UpdateBody.parse({ ...body, orgId, exerciseId });
    const updated = await exercisesService.update(input);
    return json.ok(updated, 200);
  },
  { scope: "org", minRole: "org:coach" }
);

export const DELETE = withApiAuth(
  async (
    req: AuthedRequest,
    ctx: { params: { orgId: string; exerciseId: string } }
  ) => {
    const { orgId, exerciseId } = Params.parse(ctx.params);
    await exercisesService.delete({ orgId, exerciseId });
    return new Response(null, { status: 204 });
  },
  { scope: "org", minRole: "org:coach" }
);
