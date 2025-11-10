// api/lookups/workout-types/route.ts
import { withApiAuth } from "@/features/auth/guard";
import type { AuthedRequest } from "@/features/auth/types";
import { json } from "@/lib/api";
import { lookupsService } from "@/features/lookups/service";
import { z } from "zod";

const UpsertBody = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
});
const DeleteBody = z.object({ code: z.string().min(1) });

export const GET = withApiAuth(
  async () => {
    const items = await lookupsService.listWorkoutTypes();
    return json.ok({ items }, 200);
  },
  { scope: "org", minRole: "org:viewer" }
);

export const POST = withApiAuth(
  async (req: AuthedRequest) => {
    const body = await req.json().catch(() => ({}));
    const input = UpsertBody.parse(body);
    const row = await lookupsService.upsertWorkoutType(input);
    return json.ok(row, 201);
  },
  { scope: "org", minRole: "org:admin" }
);

export const DELETE = withApiAuth(
  async (req: AuthedRequest) => {
    const body = await req.json().catch(() => ({}));
    const input = DeleteBody.parse(body);
    await lookupsService.deleteWorkoutType(input);
    return json.ok({}, 204);
  },
  { scope: "org", minRole: "org:admin" }
);
