import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { globalExercisesService } from "@/features/global-exercises/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const row = await globalExercisesService.get({ id });
      if (!row) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      return NextResponse.json(row, { status: 200 });
    }

    const input = {
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      modality: searchParams.get("modality") ?? undefined,
      isActive:
        searchParams.get("isActive") === null
          ? undefined
          : searchParams.get("isActive") === "true"
            ? true
            : searchParams.get("isActive") === "false"
              ? false
              : undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      offset: searchParams.get("offset")
        ? Number(searchParams.get("offset"))
        : undefined,
    };

    const rows = await globalExercisesService.list(input);
    return NextResponse.json(rows, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const row = await globalExercisesService.create(body);
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const row = await globalExercisesService.update(body);
    return NextResponse.json(row, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await globalExercisesService.delete({ id });
    return NextResponse.json({}, { status: 204 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
