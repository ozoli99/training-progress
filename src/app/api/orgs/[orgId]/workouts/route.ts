import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { workoutsService } from "@/features/workouts/service";

const ZParams = z.object({ orgId: z.string().uuid() });
const ZListQuery = z.object({
  q: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
const ZCreateBody = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const query = ZListQuery.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    const items = await workoutsService.list({ orgId, ...query });
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId } = ZParams.parse(params);
    if (ctx.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch." }, { status: 403 });
    }

    const body = ZCreateBody.parse(await req.json().catch(() => ({})));
    const row = await workoutsService.create({ orgId, ...body });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
