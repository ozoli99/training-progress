import { and, eq, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  org,
  orgMember,
  orgSettings,
  userAccount,
  type org as OrgTbl,
} from "@/infrastructure/db/schema";
import type {
  TOrgMemberRow,
  TOrgRow,
  TOrgSettingsRow,
  TOrgWithSettings,
} from "./dto";

export interface OrgsRepository {
  ensureUserAccount(input: {
    clerkUserId: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
  }): Promise<string>;

  upsertOrgFromClerk(input: {
    clerkOrgId: string;
    name: string;
    ownerUserId?: string;
  }): Promise<TOrgRow>;

  createOrg(input: {
    name: string;
    ownerUserId?: string;
    clerkOrgId?: string;
  }): Promise<TOrgRow>;

  listOrgsForUser(input: {
    userId?: string;
    clerkUserId?: string;
  }): Promise<TOrgRow[]>;

  getOrgById(orgId: string): Promise<TOrgRow | null>;
  getOrgWithSettings(orgId: string): Promise<TOrgWithSettings | null>;
  getMembers(orgId: string): Promise<TOrgMemberRow[]>;

  findByClerkOrgId(clerkOrgId: string): Promise<TOrgRow | null>;

  setOrgSettings(input: {
    orgId: string;
    units?: "metric" | "imperial";
    timezone?: string;
    defaultTrainingLocationId?: string | null;
    preferences?: unknown;
  }): Promise<TOrgSettingsRow>;

  addMember(input: {
    orgId: string;
    userId: string;
    role: "owner" | "admin" | "coach" | "athlete";
    clerkMembershipId?: string;
  }): Promise<void>;

  changeMemberRole(input: {
    orgId: string;
    userId: string;
    role: "owner" | "admin" | "coach" | "athlete";
  }): Promise<void>;

  removeMember(input: { orgId: string; userId: string }): Promise<void>;
}

export function makeOrgsRepository(database = defaultDatabase): OrgsRepository {
  return {
    async ensureUserAccount({ clerkUserId, email, fullName, avatarUrl }) {
      const [existingByClerk] = await database
        .select({ id: userAccount.id })
        .from(userAccount)
        .where(eq(userAccount.clerkUserId, clerkUserId))
        .limit(1);

      if (existingByClerk?.id) {
        await database
          .update(userAccount)
          .set({
            email,
            fullName: fullName ?? null,
            avatarUrl: avatarUrl ?? null,
            updatedAt: sql`now()`,
          })
          .where(eq(userAccount.id, existingByClerk.id));
        return existingByClerk.id;
      }

      const [existingByEmail] = await database
        .select({ id: userAccount.id })
        .from(userAccount)
        .where(eq(userAccount.email, email))
        .limit(1);

      if (existingByEmail?.id) {
        await database
          .update(userAccount)
          .set({
            clerkUserId,
            fullName: fullName ?? null,
            avatarUrl: avatarUrl ?? null,
            updatedAt: sql`now()`,
          })
          .where(eq(userAccount.id, existingByEmail.id));
        return existingByEmail.id;
      }

      const [inserted] = await database
        .insert(userAccount)
        .values({
          clerkUserId,
          email,
          fullName: fullName ?? null,
          avatarUrl: avatarUrl ?? null,
        })
        .returning({ id: userAccount.id });

      return inserted.id;
    },

    async upsertOrgFromClerk({ clerkOrgId, name, ownerUserId }) {
      const [existing] = await database
        .select()
        .from(org)
        .where(eq(org.clerkOrgId, clerkOrgId))
        .limit(1);

      if (existing) {
        const [updated] = await database
          .update(org)
          .set({
            name,
            ownerUserId: ownerUserId ?? existing.ownerUserId ?? null,
            updatedAt: sql`now()`,
          })
          .where(eq(org.id, existing.id))
          .returning();
        return mapOrgRow(updated);
      }

      const [created] = await database
        .insert(org)
        .values({
          name,
          clerkOrgId,
          ownerUserId: ownerUserId ?? null,
        })
        .returning();
      await database
        .insert(orgSettings)
        .values({ orgId: created.id })
        .onConflictDoNothing();
      return mapOrgRow(created);
    },

    async createOrg({ name, ownerUserId, clerkOrgId }) {
      const [created] = await database
        .insert(org)
        .values({
          name,
          ownerUserId: ownerUserId ?? null,
          clerkOrgId: clerkOrgId ?? null,
        })
        .returning();

      await database
        .insert(orgSettings)
        .values({ orgId: created.id })
        .onConflictDoNothing();

      return mapOrgRow(created);
    },

    async listOrgsForUser({ userId, clerkUserId }) {
      let uid = userId;
      if (!uid && clerkUserId) {
        const [u] = await database
          .select({ id: userAccount.id })
          .from(userAccount)
          .where(eq(userAccount.clerkUserId, clerkUserId))
          .limit(1);
        uid = u?.id;
      }
      if (!uid) return [];

      const rows = await database
        .select({
          id: org.id,
          name: org.name,
          clerkOrgId: org.clerkOrgId,
          ownerUserId: org.ownerUserId,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        })
        .from(orgMember)
        .innerJoin(org, eq(org.id, orgMember.orgId))
        .where(eq(orgMember.userId, uid));

      return rows.map(mapOrgRow);
    },

    async getOrgById(orgId) {
      const [row] = await database
        .select()
        .from(org)
        .where(eq(org.id, orgId))
        .limit(1);
      return row ? mapOrgRow(row) : null;
    },

    async getOrgWithSettings(orgId) {
      const [o] = await database
        .select()
        .from(org)
        .where(eq(org.id, orgId))
        .limit(1);
      if (!o) return null;

      const [s] = await database
        .select()
        .from(orgSettings)
        .where(eq(orgSettings.orgId, orgId))
        .limit(1);

      return {
        ...mapOrgRow(o),
        settings: s ? mapSettingsRow(s) : null,
      };
    },

    async getMembers(orgId) {
      const rows = await database
        .select({
          id: orgMember.id,
          orgId: orgMember.orgId,
          userId: orgMember.userId,
          role: orgMember.role,
          clerkMembershipId: orgMember.clerkMembershipId,
          createdAt: orgMember.createdAt,
          updatedAt: orgMember.updatedAt,
          email: userAccount.email,
          fullName: userAccount.fullName,
          avatarUrl: userAccount.avatarUrl,
        })
        .from(orgMember)
        .innerJoin(userAccount, eq(userAccount.id, orgMember.userId))
        .where(eq(orgMember.orgId, orgId));
      return rows.map((r) => ({
        id: r.id,
        orgId: r.orgId,
        userId: r.userId,
        role: r.role as TOrgMemberRow["role"],
        clerkMembershipId: r.clerkMembershipId ?? null,
        createdAt: String(r.createdAt),
        updatedAt: String(r.updatedAt),
        email: r.email ?? null,
        fullName: r.fullName ?? null,
        avatarUrl: r.avatarUrl ?? null,
      }));
    },

    async findByClerkOrgId(clerkOrgId) {
      const [row] = await database
        .select()
        .from(org)
        .where(eq(org.clerkOrgId, clerkOrgId))
        .limit(1);
      return row ? mapOrgRow(row) : null;
    },

    async setOrgSettings({
      orgId,
      units,
      timezone,
      defaultTrainingLocationId,
      preferences,
    }) {
      await database
        .insert(orgSettings)
        .values({
          orgId,
          units: units ?? undefined,
          timezone: timezone ?? undefined,
          defaultTrainingLocationId:
            defaultTrainingLocationId === undefined
              ? undefined
              : defaultTrainingLocationId,
          preferences:
            preferences === undefined ? undefined : (preferences as any),
        })
        .onConflictDoUpdate({
          target: orgSettings.orgId,
          set: {
            units: units === undefined ? sql`${orgSettings.units}` : units,
            timezone:
              timezone === undefined ? sql`${orgSettings.timezone}` : timezone,
            defaultTrainingLocationId:
              defaultTrainingLocationId === undefined
                ? sql`${orgSettings.defaultTrainingLocationId}`
                : defaultTrainingLocationId,
            preferences:
              preferences === undefined
                ? sql`${orgSettings.preferences}`
                : (preferences as any),
            updatedAt: sql`now()`,
          },
        });

      const [row] = await database
        .select()
        .from(orgSettings)
        .where(eq(orgSettings.orgId, orgId))
        .limit(1);

      return mapSettingsRow(row!);
    },

    async addMember({ orgId, userId, role, clerkMembershipId }) {
      await database
        .insert(orgMember)
        .values({
          orgId,
          userId,
          role,
          clerkMembershipId: clerkMembershipId ?? null,
        })
        .onConflictDoUpdate({
          target: [orgMember.orgId, orgMember.userId],
          set: {
            role,
            clerkMembershipId:
              clerkMembershipId ?? sql`${orgMember.clerkMembershipId}`,
            updatedAt: sql`now()`,
          },
        });
    },

    async changeMemberRole({ orgId, userId, role }) {
      await database
        .update(orgMember)
        .set({ role, updatedAt: sql`now()` })
        .where(and(eq(orgMember.orgId, orgId), eq(orgMember.userId, userId)));
    },

    async removeMember({ orgId, userId }) {
      await database
        .delete(orgMember)
        .where(and(eq(orgMember.orgId, orgId), eq(orgMember.userId, userId)));
    },
  };
}

function mapOrgRow(r: typeof OrgTbl.$inferSelect): TOrgRow {
  return {
    id: r.id,
    name: r.name,
    clerkOrgId: r.clerkOrgId ?? null,
    ownerUserId: r.ownerUserId ?? null,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

function mapSettingsRow(r: typeof orgSettings.$inferSelect): TOrgSettingsRow {
  return {
    orgId: r.orgId,
    units: (r.units as "metric" | "imperial") ?? "metric",
    timezone: r.timezone ?? "UTC",
    defaultTrainingLocationId: r.defaultTrainingLocationId ?? null,
    preferences: (r.preferences as unknown) ?? {},
    updatedAt: String(r.updatedAt),
  };
}

export const orgsRepository = makeOrgsRepository();
