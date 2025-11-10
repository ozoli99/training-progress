import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { athleteProgramsService } from "@/features/athlete-programs/service";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const url = new URL(req.url);
    const qp = url.searchParams;

    const activeOnly =
      qp.get("activeOnly")?.toLowerCase() === "true" ? true : undefined;
    const limit = qp.get("limit") ? Number(qp.get("limit")) : undefined;
    const offset = qp.get("offset") ? Number(qp.get("offset")) : undefined;

    const orderByRaw = qp.get("orderBy") as
      | "startDate"
      | "createdAt"
      | "updatedAt"
      | "currentWeek"
      | null;
    const orderBy = orderByRaw ?? undefined;

    const orderRaw = qp.get("order") as "asc" | "desc" | null;
    const order = orderRaw ?? undefined;

    const data = await athleteProgramsService.list({
      orgId: ctx.orgId!,
      athleteId: params.athleteId,
      activeOnly,
      limit,
      offset,
      orderBy,
      order,
    });

    return NextResponse.json(data);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = (await req.json().catch(() => ({}))) as {
      programId?: string;
      startDate?: string;
    };

    if (!body.programId || !body.programId.trim()) {
      throw new AppError.Validation("programId is required");
    }

    const data = await athleteProgramsService.enroll({
      orgId: ctx.orgId!,
      athleteId: params.athleteId,
      programId: body.programId,
      startDate: body.startDate,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = (await req.json().catch(() => ({}))) as {
      athleteProgramId?: string;
      currentWeek?: number;
      isActive?: boolean;
      startDate?: string;
    };

    if (!body.athleteProgramId || !body.athleteProgramId.trim()) {
      throw new AppError.Validation("athleteProgramId is required");
    }

    const data = await athleteProgramsService.patch({
      orgId: ctx.orgId!,
      athleteProgramId: body.athleteProgramId,
      currentWeek: body.currentWeek,
      isActive: body.isActive,
      startDate: body.startDate,
    });

    return NextResponse.json(data);
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId)
      throw new AppError.Forbidden("Org mismatch.");

    const body = (await req.json().catch(() => ({}))) as {
      programId?: string;
      athleteProgramId?: string;
    };

    let programId = body.programId;

    if (!programId && body.athleteProgramId) {
      const row = await athleteProgramsService.getById({
        orgId: ctx.orgId!,
        athleteProgramId: body.athleteProgramId,
      });
      programId = row.programId;
    }

    if (!programId) {
      throw new AppError.Validation(
        "Provide either programId or athleteProgramId"
      );
    }

    await athleteProgramsService.unenroll({
      orgId: ctx.orgId!,
      athleteId: params.athleteId,
      programId,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
