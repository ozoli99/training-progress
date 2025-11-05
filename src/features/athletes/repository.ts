import { and, eq, ilike, or } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  athlete,
  athleteTrainingLocation,
  athleteVisibility,
  trainingLocation,
} from "@/infrastructure/db/schema";

export type AthleteRow = InferSelectModel<typeof athlete>;
export type NewAthleteRow = InferInsertModel<typeof athlete>;

export async function insertAthlete(values: NewAthleteRow) {
  const [row] = await db.insert(athlete).values(values).returning();
  return row!;
}

export async function getAthleteById(athleteId: string) {
  const rows = await db
    .select()
    .from(athlete)
    .where(eq(athlete.id, athleteId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listAthletes(opts: {
  orgId: string;
  limit: number;
  offset: number;
  q?: string;
}) {
  const q = db
    .select({
      id: athlete.id,
      orgId: athlete.orgId,
      displayName: athlete.displayName,
      email: athlete.email,
      clerkUserId: athlete.clerkUserId,
      createdAt: athlete.createdAt,
      updatedAt: athlete.updatedAt,
      defaultTrainingLocationId: trainingLocation.id,
      defaultTrainingLocationName: trainingLocation.name,
    })
    .from(athlete)
    .leftJoin(
      athleteTrainingLocation,
      and(
        eq(athleteTrainingLocation.athleteId, athlete.id),
        eq(athleteTrainingLocation.isDefault, true)
      )
    )
    .leftJoin(
      trainingLocation,
      eq(trainingLocation.id, athleteTrainingLocation.trainingLocationId)
    )
    .where(
      and(
        eq(athlete.orgId, opts.orgId),
        opts.q
          ? or(
              ilike(athlete.displayName, `%${opts.q}%`),
              ilike(athlete.email, `%${opts.q}%`)
            )
          : (undefined as any)
      )
    )
    .orderBy(athlete.displayName)
    .limit(opts.limit)
    .offset(opts.offset);

  return q;
}

export async function updateAthleteById(
  athleteId: string,
  patch: Partial<AthleteRow>
) {
  const [row] = await db
    .update(athlete)
    .set(patch as any)
    .where(eq(athlete.id, athleteId))
    .returning();
  return row ?? null;
}

export async function deleteAthleteById(athleteId: string) {
  await db.delete(athlete).where(eq(athlete.id, athleteId));
}

export async function linkTrainingLocation(input: {
  athleteId: string;
  trainingLocationId: string;
  isDefault?: boolean;
}) {
  const [row] = await db
    .insert(athleteTrainingLocation)
    .values({
      athleteId: input.athleteId,
      trainingLocationId: input.trainingLocationId,
      isDefault: !!input.isDefault,
    })
    .onConflictDoUpdate({
      target: [
        athleteTrainingLocation.athleteId,
        athleteTrainingLocation.trainingLocationId,
      ],
      set: { isDefault: !!input.isDefault },
    })
    .returning();
  return row!;
}

export async function setDefaultTrainingLocation(input: {
  athleteId: string;
  trainingLocationId: string;
}) {
  return db.transaction(async (tx) => {
    await tx
      .update(athleteTrainingLocation)
      .set({ isDefault: false })
      .where(eq(athleteTrainingLocation.athleteId, input.athleteId));

    const [row] = await tx
      .insert(athleteTrainingLocation)
      .values({
        athleteId: input.athleteId,
        trainingLocationId: input.trainingLocationId,
        isDefault: true,
      })
      .onConflictDoUpdate({
        target: [
          athleteTrainingLocation.athleteId,
          athleteTrainingLocation.trainingLocationId,
        ],
        set: { isDefault: true },
      })
      .returning();

    return row!;
  });
}

export async function unlinkTrainingLocation(input: {
  athleteId: string;
  trainingLocationId: string;
}) {
  await db
    .delete(athleteTrainingLocation)
    .where(
      and(
        eq(athleteTrainingLocation.athleteId, input.athleteId),
        eq(athleteTrainingLocation.trainingLocationId, input.trainingLocationId)
      )
    );
}

export async function upsertVisibility(input: {
  athleteId: string;
  userId: string;
  canView?: boolean;
  canLog?: boolean;
  canViewCoachNotes?: boolean;
}) {
  const [row] = await db
    .insert(athleteVisibility)
    .values({
      athleteId: input.athleteId,
      userId: input.userId,
      canView: input.canView ?? true,
      canLog: input.canLog ?? false,
      canViewCoachNotes: input.canViewCoachNotes ?? false,
    })
    .onConflictDoUpdate({
      target: [athleteVisibility.athleteId, athleteVisibility.userId],
      set: {
        canView: input.canView ?? true,
        canLog: input.canLog ?? false,
        canViewCoachNotes: input.canViewCoachNotes ?? false,
      },
    })
    .returning();
  return row!;
}

export async function listVisibility(athleteId: string) {
  return db
    .select()
    .from(athleteVisibility)
    .where(eq(athleteVisibility.athleteId, athleteId));
}

export async function revokeVisibility(athleteId: string, userId: string) {
  await db
    .delete(athleteVisibility)
    .where(
      and(
        eq(athleteVisibility.athleteId, athleteId),
        eq(athleteVisibility.userId, userId)
      )
    );
}
