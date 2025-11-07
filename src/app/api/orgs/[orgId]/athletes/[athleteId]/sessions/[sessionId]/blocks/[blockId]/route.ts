import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { sessionBlocksService } from "@/features/session-blocks/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ZRouteParams = z.object({
  orgId: z.string().min(1),
  athleteId: z.string().min(1),
  sessionId: z.string().min(1),
  blockId: z.string().min(1),
});

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      sessionId: string;
      blockId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, athleteId, sessionId, blockId } = ZRouteParams.parse(params);

    const row = await sessionBlocksService.get({
      orgId,
      athleteId,
      sessionId,
      blockId,
    });

    if (!row) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(row, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      sessionId: string;
      blockId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, athleteId, sessionId, blockId } = ZRouteParams.parse(params);
    const body = await req.json().catch(() => ({}));

    const updated = await sessionBlocksService.update({
      orgId,
      athleteId,
      sessionId,
      blockId,
      ...body,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      orgId: string;
      athleteId: string;
      sessionId: string;
      blockId: string;
    };
  }
) {
  try {
    const ctx = await getAuthContext();
    const { orgId, athleteId, sessionId, blockId } = ZRouteParams.parse(params);

    await sessionBlocksService.delete({
      orgId,
      athleteId,
      sessionId,
      blockId,
    });

    return NextResponse.json({ ok: true }, { status: 204 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
