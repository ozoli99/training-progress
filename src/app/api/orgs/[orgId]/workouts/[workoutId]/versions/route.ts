import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { workoutsService } from "@/features/workouts/service";

const ZParams = z.object({
  orgId: z.string().uuid(),
  workoutId: z.string().uuid(),
});
const ZListQuery = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
const ZCreateBody = z.object({
  status: z.enum(["active", "archived"]).optional(),
  cloneFromVersionId: z.string().uuid().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; workoutId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const query = ZListQuery.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );

    const items = await workoutsService.listVersions({
      orgId,
      workoutId,
      ...query,
    });
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; workoutId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const body = ZCreateBody.parse(await req.json().catch(() => ({})));
    const row = await workoutsService.createVersion({
      orgId,
      workoutId,
      status: body.status,
      createdBy: ctx.userId ?? undefined,
      cloneFromVersionId: body.cloneFromVersionId,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
