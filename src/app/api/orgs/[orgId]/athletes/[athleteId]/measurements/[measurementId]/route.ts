import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { athleteMeasurementsService } from "@/features/athlete-measurements/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: { orgId: string; athleteId: string; measurementId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const row = await athleteMeasurementsService.getById({
      orgId: params.orgId,
      athleteMeasurementId: params.measurementId,
    });

    if (!row) {
      throw new AppError.NotFound("Measurement not found.");
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
  }: { params: { orgId: string; athleteId: string; measurementId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const body = await req.json().catch(() => ({}));
    const updated = await athleteMeasurementsService.update({
      orgId: params.orgId,
      athleteId: params.athleteId,
      athleteMeasurementId: params.measurementId,
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
  }: { params: { orgId: string; athleteId: string; measurementId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    await athleteMeasurementsService.delete({
      orgId: params.orgId,
      athleteMeasurementId: params.measurementId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
