import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { setLogsService } from "@/features/set-logs/service";

export const dynamic = "force-dynamic";

type P = {
  orgId: string;
  athleteId: string;
  sessionId: string;
  setLogId: string;
};

export async function GET(_req: NextRequest, { params }: { params: P }) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const data = await setLogsService.get(params);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: P }) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));
    const updated = await setLogsService.update({
      ...params,
      ...body,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: P }) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    await setLogsService.delete(params);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return handleApiError(err);
  }
}
