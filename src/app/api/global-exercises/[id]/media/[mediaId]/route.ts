import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { globalExercisesService } from "@/features/global-exercises/service";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const row = await globalExercisesService.updateMedia({
      id: params.mediaId,
      title: body.title,
      displayOrder: body.displayOrder,
    });
    return NextResponse.json(row, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    await globalExercisesService.deleteMedia({ id: params.mediaId });
    return NextResponse.json({}, { status: 204 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
