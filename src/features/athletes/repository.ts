import { and, eq, ilike, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  athlete,
  athleteTrainingLocation,
  trainingLocation,
  athleteVisibility,
  type athlete as AthleteTbl,
} from "@/infrastructure/db/schema";
import type {
  TAthleteRow,
  TAthleteLocationRow,
  TAthleteVisibilityRow,
} from "./dto";

export interface AthletesRepository {
  list(input: {
    orgId: string;
    search?: string;
    limit: number;
    offset: number;
  }): Promise<TAthleteRow[]>;
  get(input: { orgId: string; athleteId: string }): Promise<TAthleteRow | null>;
  create(input: {
    orgId: string;
    displayName: string;
    email?: string;
    clerkUserId?: string;
  }): Promise<TAthleteRow>;
  update(input: {
    orgId: string;
    athleteId: string;
    displayName?: string;
    email?: string | null;
  }): Promise<TAthleteRow>;
  delete(input: { orgId: string; athleteId: string }): Promise<void>;

  listLocations(input: {
    orgId: string;
    athleteId: string;
  }): Promise<TAthleteLocationRow[]>;
  linkLocation(input: {
    orgId: string;
    athleteId: string;
    trainingLocationId: string;
    isDefault?: boolean;
  }): Promise<void>;
  unlinkLocation(input: {
    orgId: string;
    athleteId: string;
    trainingLocationId: string;
  }): Promise<void>;
  setDefaultLocation(input: {
    orgId: string;
    athleteId: string;
    trainingLocationId: string;
  }): Promise<void>;

  upsertVisibility(input: {
    orgId: string;
    athleteId: string;
    userId: string;
    canView?: boolean;
    canLog?: boolean;
    canViewCoachNotes?: boolean;
  }): Promise<TAthleteVisibilityRow>;
  listVisibility(input: {
    orgId: string;
    athleteId: string;
  }): Promise<TAthleteVisibilityRow[]>;
}

export function makeAthletesRepository(
  database = defaultDatabase
): AthletesRepository {
  return {
    async list({ orgId, search, limit, offset }) {
      const rows = await database
        .select()
        .from(athlete)
        .where(
          and(
            eq(athlete.orgId, orgId),
            search ? ilike(athlete.displayName, `%${search}%`) : sql`true`
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(athlete.createdAt);

      return rows.map(mapAthleteRow);
    },

    async get({ orgId, athleteId }) {
      const [row] = await database
        .select()
        .from(athlete)
        .where(and(eq(athlete.orgId, orgId), eq(athlete.id, athleteId)))
        .limit(1);
      return row ? mapAthleteRow(row) : null;
    },

    async create({ orgId, displayName, email, clerkUserId }) {
      const [created] = await database
        .insert(athlete)
        .values({
          orgId,
          displayName,
          email: email ?? null,
          clerkUserId: clerkUserId ?? null,
        })
        .returning();
      return mapAthleteRow(created);
    },

    async update({ orgId, athleteId, displayName, email }) {
      const [updated] = await database
        .update(athlete)
        .set({
          displayName:
            displayName === undefined
              ? sql`${athlete.displayName}`
              : displayName,
          email: email === undefined ? sql`${athlete.email}` : (email as any),
          updatedAt: sql`now()`,
        })
        .where(and(eq(athlete.orgId, orgId), eq(athlete.id, athleteId)))
        .returning();
      return mapAthleteRow(updated!);
    },

    async delete({ orgId, athleteId }) {
      await database
        .delete(athlete)
        .where(and(eq(athlete.orgId, orgId), eq(athlete.id, athleteId)));
    },

    async listLocations({ orgId, athleteId }) {
      const rows = await database
        .select({
          id: athleteTrainingLocation.id,
          athleteId: athleteTrainingLocation.athleteId,
          trainingLocationId: athleteTrainingLocation.trainingLocationId,
          isDefault: athleteTrainingLocation.isDefault,
          locationName: trainingLocation.name,
          locationType: trainingLocation.type,
          address: trainingLocation.address,
        })
        .from(athleteTrainingLocation)
        .innerJoin(
          trainingLocation,
          eq(trainingLocation.id, athleteTrainingLocation.trainingLocationId)
        )
        .where(
          and(
            eq(athleteTrainingLocation.athleteId, athleteId),
            eq(trainingLocation.orgId, orgId)
          )
        );

      return rows.map((r) => ({
        id: r.id,
        athleteId: r.athleteId,
        trainingLocationId: r.trainingLocationId,
        isDefault: !!r.isDefault,
        locationName: r.locationName ?? null,
        locationType: r.locationType ?? null,
        address: r.address ?? null,
      }));
    },

    async linkLocation({ orgId, athleteId, trainingLocationId, isDefault }) {
      await database
        .insert(athleteTrainingLocation)
        .values({
          athleteId,
          trainingLocationId,
          isDefault: !!isDefault,
        })
        .onConflictDoUpdate({
          target: [
            athleteTrainingLocation.athleteId,
            athleteTrainingLocation.trainingLocationId,
          ],
          set: {
            isDefault:
              isDefault === undefined
                ? sql`${athleteTrainingLocation.isDefault}`
                : !!isDefault,
          },
        });

      if (isDefault) {
        await database
          .update(athleteTrainingLocation)
          .set({ isDefault: false })
          .where(
            and(
              eq(athleteTrainingLocation.athleteId, athleteId),
              sql`${athleteTrainingLocation.trainingLocationId} <> ${trainingLocationId}`
            )
          );
      }
    },

    async unlinkLocation({ orgId, athleteId, trainingLocationId }) {
      await database
        .delete(athleteTrainingLocation)
        .where(
          and(
            eq(athleteTrainingLocation.athleteId, athleteId),
            eq(athleteTrainingLocation.trainingLocationId, trainingLocationId)
          )
        );
    },

    async setDefaultLocation({ orgId, athleteId, trainingLocationId }) {
      await database
        .update(athleteTrainingLocation)
        .set({ isDefault: false })
        .where(eq(athleteTrainingLocation.athleteId, athleteId));

      await database
        .update(athleteTrainingLocation)
        .set({ isDefault: true })
        .where(
          and(
            eq(athleteTrainingLocation.athleteId, athleteId),
            eq(athleteTrainingLocation.trainingLocationId, trainingLocationId)
          )
        );
    },

    async upsertVisibility({
      orgId,
      athleteId,
      userId,
      canView,
      canLog,
      canViewCoachNotes,
    }) {
      const [row] = await database
        .insert(athleteVisibility)
        .values({
          athleteId,
          userId,
          canView: canView ?? true,
          canLog: canLog ?? false,
          canViewCoachNotes: canViewCoachNotes ?? false,
        })
        .onConflictDoUpdate({
          target: [athleteVisibility.athleteId, athleteVisibility.userId],
          set: {
            canView:
              canView === undefined
                ? sql`${athleteVisibility.canView}`
                : !!canView,
            canLog:
              canLog === undefined
                ? sql`${athleteVisibility.canLog}`
                : !!canLog,
            canViewCoachNotes:
              canViewCoachNotes === undefined
                ? sql`${athleteVisibility.canViewCoachNotes}`
                : !!canViewCoachNotes,
          },
        })
        .returning();

      return {
        id: row!.id,
        athleteId: row!.athleteId,
        userId: row!.userId,
        canView: !!row!.canView,
        canLog: !!row!.canLog,
        canViewCoachNotes: !!row!.canViewCoachNotes,
      };
    },

    async listVisibility({ orgId, athleteId }) {
      const rows = await database
        .select()
        .from(athleteVisibility)
        .where(eq(athleteVisibility.athleteId, athleteId));
      return rows.map((r) => ({
        id: r.id,
        athleteId: r.athleteId,
        userId: r.userId,
        canView: !!r.canView,
        canLog: !!r.canLog,
        canViewCoachNotes: !!r.canViewCoachNotes,
      })) as TAthleteVisibilityRow[];
    },
  };
}

function mapAthleteRow(r: typeof AthleteTbl.$inferSelect): TAthleteRow {
  return {
    id: r.id,
    orgId: r.orgId,
    displayName: r.displayName,
    email: r.email ?? null,
    clerkUserId: r.clerkUserId ?? null,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

export const athletesRepository = makeAthletesRepository();
