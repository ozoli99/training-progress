import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { progressionService } from "@/features/progression/service";

function boolParam(v: string | null): boolean | undefined {
  if (v == null) return undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function asOrderBy(v: string | null): "id" | "name" | undefined {
  return v === "id" || v === "name" ? v : undefined;
}

function asAppliesTo(v: string | null): "exercise" | "workout" | undefined {
  return v === "exercise" || v === "workout" ? v : undefined;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");
    const orderBy = asOrderBy(url.searchParams.get("orderBy")); // <-- narrowed
    const order =
      (url.searchParams.get("order") as "asc" | "desc" | null) ?? undefined;
    const activeOnly = boolParam(url.searchParams.get("activeOnly"));
    const appliesTo = asAppliesTo(url.searchParams.get("appliesTo")); // <-- narrowed
    const exerciseId = url.searchParams.get("exerciseId") || undefined;
    const workoutId = url.searchParams.get("workoutId") || undefined;

    const rows = await progressionService.listRules({
      orgId: ctx.orgId!,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      orderBy,
      order,
      activeOnly,
      appliesTo,
      exerciseId,
      workoutId,
    });

    return NextResponse.json(rows);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const raw = await req.json().catch(() => ({}));
    const appliesTo = asAppliesTo(raw.appliesTo);

    const created = await progressionService.createRule({
      orgId: ctx.orgId!,
      name: raw.name,
      appliesTo,
      exerciseId: raw.exerciseId,
      workoutId: raw.workoutId,
      conditionJson: raw.conditionJson,
      active: raw.active,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
