import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  athleteProfile,
  athleteProfileMetric,
  profileDimension,
  type athleteProfile as AthleteProfileTbl,
  type athleteProfileMetric as AthleteProfileMetricTbl,
} from "@/infrastructure/db/schema";
import type { TAthleteProfileRow, TAthleteProfileMetricRow } from "./dto";

const toNumericDB = (n: number | null | undefined) =>
  n === undefined ? undefined : n === null ? null : String(n);

export interface AthleteProfilesRepository {
  list(input: {
    orgId: string;
    athleteId: string;
    from?: string;
    to?: string;
    limit: number;
    offset: number;
    order: "asc" | "desc";
  }): Promise<TAthleteProfileRow[]>;

  getById(input: {
    orgId: string;
    athleteProfileId: string;
  }): Promise<TAthleteProfileRow | null>;

  getByDay(input: {
    orgId: string;
    athleteId: string;
    profileDate: string; // YYYY-MM-DD
  }): Promise<TAthleteProfileRow | null>;

  upsert(input: {
    orgId: string;
    athleteId: string;
    profileDate: string;
    strengthIndex?: number | null;
    athleteScore?: number | null;
    lastMetrics?: Record<string, any> | null;
  }): Promise<TAthleteProfileRow>;

  update(input: {
    orgId: string;
    athleteProfileId: string;
    strengthIndex?: number | null;
    athleteScore?: number | null;
    lastMetrics?: Record<string, any> | null;
  }): Promise<TAthleteProfileRow>;

  delete(input: { orgId: string; athleteProfileId: string }): Promise<void>;

  listMetrics(input: {
    orgId: string;
    athleteProfileId: string;
  }): Promise<TAthleteProfileMetricRow[]>;

  setMetric(input: {
    orgId: string;
    athleteId: string;
    athleteProfileId: string;
    profileDimensionId: string;
    value: number;
  }): Promise<TAthleteProfileMetricRow>;
}

export function makeAthleteProfilesRepository(
  database = defaultDatabase
): AthleteProfilesRepository {
  return {
    async list({ orgId, athleteId, from, to, limit, offset, order }) {
      const where = and(
        eq(athleteProfile.orgId, orgId),
        eq(athleteProfile.athleteId, athleteId),
        from ? gte(athleteProfile.profileDate, from) : sql`true`,
        to ? lte(athleteProfile.profileDate, to) : sql`true`
      );

      const rows = await database
        .select()
        .from(athleteProfile)
        .where(where)
        .orderBy(
          order === "asc"
            ? asc(athleteProfile.profileDate)
            : desc(athleteProfile.profileDate)
        )
        .limit(limit)
        .offset(offset);

      return rows.map(mapProfileRow);
    },

    async getById({ orgId, athleteProfileId }) {
      const [row] = await database
        .select()
        .from(athleteProfile)
        .where(
          and(
            eq(athleteProfile.orgId, orgId),
            eq(athleteProfile.id, athleteProfileId)
          )
        )
        .limit(1);

      return row ? mapProfileRow(row) : null;
    },

    async getByDay({ orgId, athleteId, profileDate }) {
      const [row] = await database
        .select()
        .from(athleteProfile)
        .where(
          and(
            eq(athleteProfile.orgId, orgId),
            eq(athleteProfile.athleteId, athleteId),
            eq(athleteProfile.profileDate, profileDate)
          )
        )
        .limit(1);

      return row ? mapProfileRow(row) : null;
    },

    async upsert({
      orgId,
      athleteId,
      profileDate,
      strengthIndex,
      athleteScore,
      lastMetrics,
    }) {
      const [row] = await database
        .insert(athleteProfile)
        .values({
          orgId,
          athleteId,
          profileDate,
          strengthIndex: toNumericDB(strengthIndex),
          athleteScore: toNumericDB(athleteScore),
          lastMetrics: lastMetrics ?? null,
        })
        .onConflictDoUpdate({
          target: [
            athleteProfile.orgId,
            athleteProfile.athleteId,
            athleteProfile.profileDate,
          ],
          set: {
            strengthIndex:
              strengthIndex === undefined
                ? sql`${athleteProfile.strengthIndex}`
                : toNumericDB(strengthIndex),
            athleteScore:
              athleteScore === undefined
                ? sql`${athleteProfile.athleteScore}`
                : toNumericDB(athleteScore),
            lastMetrics:
              lastMetrics === undefined
                ? sql`${athleteProfile.lastMetrics}`
                : (lastMetrics as unknown),
          },
        })
        .returning();

      return mapProfileRow(row!);
    },

    async update({
      orgId,
      athleteProfileId,
      strengthIndex,
      athleteScore,
      lastMetrics,
    }) {
      const [row] = await database
        .update(athleteProfile)
        .set({
          strengthIndex:
            strengthIndex === undefined
              ? sql`${athleteProfile.strengthIndex}`
              : toNumericDB(strengthIndex),
          athleteScore:
            athleteScore === undefined
              ? sql`${athleteProfile.athleteScore}`
              : toNumericDB(athleteScore),
          lastMetrics:
            lastMetrics === undefined
              ? sql`${athleteProfile.lastMetrics}`
              : (lastMetrics as unknown),
        })
        .where(
          and(
            eq(athleteProfile.orgId, orgId),
            eq(athleteProfile.id, athleteProfileId)
          )
        )
        .returning();

      return mapProfileRow(row!);
    },

    async delete({ orgId, athleteProfileId }) {
      await database
        .delete(athleteProfile)
        .where(
          and(
            eq(athleteProfile.orgId, orgId),
            eq(athleteProfile.id, athleteProfileId)
          )
        );
    },

    async listMetrics({ orgId, athleteProfileId }) {
      const rows = await database
        .select()
        .from(athleteProfileMetric)
        .where(
          and(
            eq(athleteProfileMetric.orgId, orgId),
            eq(athleteProfileMetric.athleteProfileId, athleteProfileId)
          )
        )
        .orderBy(asc(athleteProfileMetric.profileDimensionId));

      return rows.map(mapMetricRow);
    },

    async setMetric({
      orgId,
      athleteId,
      athleteProfileId,
      profileDimensionId,
      value,
    }) {
      // Optional guard: ensure dimension exists and belongs to same org (lightweight join)
      await database
        .select({ id: profileDimension.id })
        .from(profileDimension)
        .where(
          and(
            eq(profileDimension.id, profileDimensionId),
            eq(profileDimension.orgId, orgId)
          )
        )
        .limit(1);

      const [row] = await database
        .insert(athleteProfileMetric)
        .values({
          orgId,
          athleteId,
          athleteProfileId,
          profileDimensionId,
          value: String(value),
        })
        .onConflictDoUpdate({
          target: [
            athleteProfileMetric.athleteProfileId,
            athleteProfileMetric.profileDimensionId,
          ],
          set: { value: String(value) },
        })
        .returning();

      return mapMetricRow(row!);
    },
  };
}

function toNumberOrNull(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapProfileRow(
  r: typeof AthleteProfileTbl.$inferSelect
): TAthleteProfileRow {
  return {
    id: r.id,
    orgId: r.orgId,
    athleteId: r.athleteId,
    profileDate: String(r.profileDate),
    strengthIndex: toNumberOrNull(r.strengthIndex),
    athleteScore: toNumberOrNull(r.athleteScore),
    lastMetrics: (r.lastMetrics as any) ?? null,
  };
}

function mapMetricRow(
  r: typeof AthleteProfileMetricTbl.$inferSelect
): TAthleteProfileMetricRow {
  return {
    id: r.id,
    orgId: r.orgId,
    athleteId: r.athleteId,
    athleteProfileId: r.athleteProfileId,
    profileDimensionId: r.profileDimensionId,
    value: Number(r.value),
  };
}

export const athleteProfilesRepository = makeAthleteProfilesRepository();
