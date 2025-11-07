import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { globalExercisesService } from "@/features/global-exercises/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const list = await globalExercisesService.listMedia({
      globalExerciseId: params.id,
    });
    return NextResponse.json(list, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const base = await req.json().catch(() => ({}));
    const row = await globalExercisesService.createMedia({
      globalExerciseId: params.id,
      mediaType: base.mediaType,
      url: base.url,
      title: base.title,
      displayOrder: base.displayOrder,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
