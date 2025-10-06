import { db } from "../db/client";
import { exercises } from "../db/schema";
import { eq } from "drizzle-orm";

export async function listExercises() {
  return db.select().from(exercises).orderBy(exercises.name);
}

export async function getExerciseById(id: string) {
  const [row] = await db.select().from(exercises).where(eq(exercises.id, id));
  return row ?? null;
}

export async function createExercise(dto: {
  id: string;
  name: string;
  unit: string;
}) {
  await db.insert(exercises).values(dto);
  return dto;
}
