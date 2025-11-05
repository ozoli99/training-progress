import { db } from "@/infrastructure/db/client";
import {
  org,
  orgSettings,
  orgMember,
  userAccount,
  type org as orgTable,
} from "@/infrastructure/db/schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { and, eq, like, sql } from "drizzle-orm";

export type OrgRow = InferSelectModel<typeof org>;
export type NewOrgRow = InferInsertModel<typeof org>;

export type OrgSettingsRow = InferSelectModel<typeof orgSettings>;
export type NewOrgSettingsRow = InferInsertModel<typeof orgSettings>;

export type OrgMemberRow = InferSelectModel<typeof orgMember>;
export type NewOrgMemberRow = InferInsertModel<typeof orgMember>;

export async function insertOrg(values: NewOrgRow): Promise<OrgRow> {
  const [row] = await db.insert(org).values(values).returning();
  return row;
}

export async function updateOrgById(id: string, patch: Partial<OrgRow>) {
  const [row] = await db
    .update(org)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(org.id, id))
    .returning();
  return row ?? null;
}

export async function getOrgById(id: string): Promise<OrgRow | null> {
  const rows = await db.select().from(org).where(eq(org.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOrgByClerkId(
  clerkOrgId: string
): Promise<OrgRow | null> {
  const rows = await db
    .select()
    .from(org)
    .where(eq(org.clerkOrgId, clerkOrgId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listOrgs(opts: {
  limit: number;
  offset: number;
  ownerUserId?: string;
  clerkOrgId?: string;
  q?: string;
}): Promise<OrgRow[]> {
  const filters = [
    opts.ownerUserId ? eq(org.ownerUserId, opts.ownerUserId) : undefined,
    opts.clerkOrgId ? eq(org.clerkOrgId, opts.clerkOrgId) : undefined,
    opts.q ? like(org.name, `%${opts.q}%`) : undefined,
  ].filter(Boolean) as any[];

  return db
    .select()
    .from(org)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(org.createdAt)
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function deleteOrgById(id: string) {
  await db.delete(org).where(eq(org.id, id));
}

export async function upsertOrgSettings(
  values: NewOrgSettingsRow
): Promise<OrgSettingsRow> {
  const [row] = await db
    .insert(orgSettings)
    .values(values)
    .onConflictDoUpdate({
      target: orgSettings.orgId,
      set: {
        units: values.units ?? sql`excluded.units`,
        timezone: values.timezone ?? sql`excluded.timezone`,
        defaultTrainingLocationId:
          values.defaultTrainingLocationId ??
          sql`excluded.default_training_location_id`,
        preferences: values.preferences ?? sql`excluded.preferences`,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row!;
}

export async function getOrgSettings(
  orgId: string
): Promise<OrgSettingsRow | null> {
  const rows = await db
    .select()
    .from(orgSettings)
    .where(eq(orgSettings.orgId, orgId))
    .limit(1);
  return rows[0] ?? null;
}

export async function addMember(
  values: NewOrgMemberRow
): Promise<OrgMemberRow> {
  const [row] = await db.insert(orgMember).values(values).returning();
  return row!;
}

export async function getMember(orgId: string, userId: string) {
  const rows = await db
    .select()
    .from(orgMember)
    .where(and(eq(orgMember.orgId, orgId), eq(orgMember.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateMember(
  orgId: string,
  userId: string,
  patch: Partial<OrgMemberRow>
) {
  const [row] = await db
    .update(orgMember)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(orgMember.orgId, orgId), eq(orgMember.userId, userId)))
    .returning();
  return row ?? null;
}

export async function removeMember(orgId: string, userId: string) {
  await db
    .delete(orgMember)
    .where(and(eq(orgMember.orgId, orgId), eq(orgMember.userId, userId)));
}

export async function listMembers(orgId: string): Promise<
  (OrgMemberRow & {
    user?: { id: string; email: string | null; fullName: string | null };
  })[]
> {
  const rows = await db
    .select({
      id: orgMember.id,
      orgId: orgMember.orgId,
      userId: orgMember.userId,
      role: orgMember.role,
      clerkMembershipId: orgMember.clerkMembershipId,
      createdAt: orgMember.createdAt,
      updatedAt: orgMember.updatedAt,
      user_id: userAccount.id,
      user_email: userAccount.email,
      user_full_name: userAccount.fullName,
    })
    .from(orgMember)
    .leftJoin(userAccount, eq(userAccount.id, orgMember.userId))
    .where(eq(orgMember.orgId, orgId));

  return rows.map((r) => {
    const base: OrgMemberRow = {
      id: r.id,
      orgId: r.orgId,
      userId: r.userId,
      role: r.role,
      clerkMembershipId: r.clerkMembershipId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };

    if (r.user_id) {
      return {
        ...base,
        user: {
          id: r.user_id,
          email: r.user_email,
          fullName: r.user_full_name,
        },
      };
    }

    return base;
  });
}
