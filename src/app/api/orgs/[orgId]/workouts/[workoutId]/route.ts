import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { workoutsService } from "@/features/workouts/service";

const ZParams = z.object({
  orgId: z.string().uuid(),
  workoutId: z.string().uuid(),
});
const ZPatchBody = z
  .object({
    name: z.string().min(1).optional(),
    type: z.string().optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "No fields to update.",
  });

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; workoutId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const row = await workoutsService.get({ orgId, workoutId });
    return NextResponse.json(row);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; workoutId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const patch = ZPatchBody.parse(await req.json().catch(() => ({})));
    const row = await workoutsService.update({ orgId, workoutId, ...patch });
    return NextResponse.json(row);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; workoutId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    await workoutsService.delete({ orgId, workoutId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
