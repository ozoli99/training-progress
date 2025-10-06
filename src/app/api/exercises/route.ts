import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { exerciseCreateSchema } from "@/domain/schemas/exercise";
import {
  listExercises,
  createExercise,
} from "@/infrastructure/repos/exerciseRepo";

export async function GET() {
  return NextResponse.json(await listExercises());
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = exerciseCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const created = await createExercise({ id: nanoid(), ...parsed.data });
  return NextResponse.json(created, { status: 201 });
}
