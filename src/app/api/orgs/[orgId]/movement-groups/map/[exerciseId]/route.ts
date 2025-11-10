import { NextRequest, NextResponse } from "next/server";
import { handleApiError, AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { db } from "@/infrastructure/db/client";
import * as s from "@/infrastructure/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function assertExerciseInOrg(exerciseId: string, orgId: string) {
  const rows = await db
    .select({ id: s.exercise.id })
    .from(s.exercise)
    .where(and(eq(s.exercise.id, exerciseId), eq(s.exercise.orgId, orgId)))
    .limit(1);
  if (!rows.length) throw new AppError.NotFound("Exercise not found in org.");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; exerciseId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    await assertExerciseInOrg(params.exerciseId, params.orgId);

    const rows = await db
      .select({
        id: s.movementGroup.id,
        orgId: s.movementGroup.orgId,
        name: s.movementGroup.name,
        description: s.movementGroup.description,
        isActive: s.movementGroup.isActive,
      })
      .from(s.exerciseMovementGroup)
      .innerJoin(
        s.movementGroup,
        eq(s.movementGroup.id, s.exerciseMovementGroup.movementGroupId)
      )
      .where(eq(s.exerciseMovementGroup.exerciseId, params.exerciseId))
      .orderBy(s.movementGroup.name);

    return NextResponse.json(rows, { status: 200 });
  } catch (e: unknown) {
    return handleApiError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orgId: string; exerciseId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    await assertExerciseInOrg(params.exerciseId, params.orgId);

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.movementGroupIds)
      ? body.movementGroupIds
      : [];

    if (ids.length) {
      const mgRows = await db
        .select({ id: s.movementGroup.id })
        .from(s.movementGroup)
        .where(
          and(
            eq(s.movementGroup.orgId, params.orgId),
            inArray(s.movementGroup.id, ids)
          )
        );

      const found = new Set(mgRows.map((r) => r.id));
      const missing = ids.filter((id) => !found.has(id));
      if (missing.length) {
        throw new AppError.BadRequest(
          `Unknown movementGroupIds for this org: ${missing.join(", ")}`
        );
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(s.exerciseMovementGroup)
        .where(eq(s.exerciseMovementGroup.exerciseId, params.exerciseId));

      if (ids.length) {
        await tx.insert(s.exerciseMovementGroup).values(
          ids.map((movementGroupId) => ({
            exerciseId: params.exerciseId,
            movementGroupId,
          }))
        );
      }
    });

    const rows = await db
      .select({
        id: s.movementGroup.id,
        orgId: s.movementGroup.orgId,
        name: s.movementGroup.name,
        description: s.movementGroup.description,
        isActive: s.movementGroup.isActive,
      })
      .from(s.exerciseMovementGroup)
      .innerJoin(
        s.movementGroup,
        eq(s.movementGroup.id, s.exerciseMovementGroup.movementGroupId)
      )
      .where(eq(s.exerciseMovementGroup.exerciseId, params.exerciseId))
      .orderBy(s.movementGroup.name);

    return NextResponse.json(rows, { status: 200 });
  } catch (e: unknown) {
    return handleApiError(e);
  }
}
