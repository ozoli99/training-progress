import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { workoutsService } from "@/features/workouts/service";

const ZParams = z.object({
  orgId: z.string().uuid(),
  workoutId: z.string().uuid(),
});
const ZVersionQuery = z.object({
  versionId: z.string().uuid(),
});
const ZReplaceBody = z.object({
  items: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        blockIndex: z.coerce.number().int().nonnegative().default(0),
        prescription: z.string().optional(),
      })
    )
    .max(500),
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
    const { versionId } = ZVersionQuery.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );

    const items = await workoutsService.listVersionParts({
      orgId,
      workoutId,
      versionId,
    });
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orgId: string; workoutId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, workoutId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }
    const { versionId } = ZVersionQuery.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    const { items } = ZReplaceBody.parse(await req.json().catch(() => ({})));

    const updated = await workoutsService.replaceVersionParts({
      orgId,
      workoutId,
      versionId,
      items,
    });
    return NextResponse.json({ items: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
