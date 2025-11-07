import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { workoutsService } from "@/features/workouts/service";

const ZParams = z.object({
  orgId: z.string().uuid(),
  workoutId: z.string().uuid(),
  versionId: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: { orgId: string; workoutId: string; versionId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutId, versionId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const row = await workoutsService.getVersion({
      orgId,
      workoutId,
      versionId,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return handleApiError(err);
  }
}
