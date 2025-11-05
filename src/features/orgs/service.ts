import { AppError } from "@/shared/errors";
import type {
  CreateOrgInput,
  UpdateOrgInput,
  AddMemberInput,
  UpdateMemberInput,
} from "./dto";
import {
  insertOrg,
  getOrgById,
  getOrgByClerkId,
  listOrgs,
  updateOrgById,
  deleteOrgById,
  upsertOrgSettings,
  getOrgSettings,
  addMember,
  getMember,
  updateMember,
  removeMember,
  listMembers,
} from "./repository";
import { db } from "@/infrastructure/db/client";
import { orgMember } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

function toOrgResponse(
  row: NonNullable<Awaited<ReturnType<typeof getOrgById>>>
) {
  return {
    id: row.id,
    name: row.name,
    ownerUserId: row.ownerUserId ?? null,
    clerkOrgId: row.clerkOrgId ?? null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

const toIso = (d: any) =>
  typeof d === "string" ? d : (d?.toISOString?.() ?? new Date(d).toISOString());

export async function createOrgService(input: CreateOrgInput) {
  if (input.clerkOrgId) {
    const exists = await getOrgByClerkId(input.clerkOrgId);
    if (exists)
      throw new AppError.Conflict("This Clerk organization is already linked");
  }

  const row = await db.transaction(async (tx) => {
    const orgRow = await insertOrg({
      name: input.name,
      ownerUserId: input.ownerUserId ?? null,
      clerkOrgId: input.clerkOrgId ?? null,
    });

    await upsertOrgSettings({
      orgId: orgRow.id,
      units: "metric",
      timezone: "UTC",
      preferences: {},
      updatedAt: new Date(),
    });

    if (input.ownerUserId) {
      await tx
        .insert(orgMember)
        .values({
          orgId: orgRow.id,
          userId: input.ownerUserId,
          role: "owner",
        })
        .onConflictDoNothing();
    }

    return orgRow;
  });

  return toOrgResponse(row);
}

export async function fetchOrgService(id: string) {
  const row = await getOrgById(id);
  if (!row) throw new AppError.NotFound("Organization not found");
  return toOrgResponse(row);
}

export async function listOrgsService(params: {
  limit: number;
  offset: number;
  ownerUserId?: string;
  clerkOrgId?: string;
  q?: string;
}) {
  const rows = await listOrgs(params);
  return rows.map(toOrgResponse);
}

export async function patchOrgService(id: string, patch: UpdateOrgInput) {
  const existing = await getOrgById(id);
  if (!existing) throw new AppError.NotFound("Organization not found");

  if (patch.clerkOrgId && patch.clerkOrgId !== existing.clerkOrgId) {
    const clash = await getOrgByClerkId(patch.clerkOrgId);
    if (clash)
      throw new AppError.Conflict("This Clerk organization is already linked");
  }

  const updated = await updateOrgById(id, {
    name: patch.name ?? existing.name,
    ownerUserId: patch.ownerUserId ?? existing.ownerUserId,
    clerkOrgId: patch.clerkOrgId ?? existing.clerkOrgId,
  });
  if (!updated) throw new AppError.NotFound("Organization not found");
  return toOrgResponse(updated);
}

export async function removeOrgService(id: string) {
  const existing = await getOrgById(id);
  if (!existing) throw new AppError.NotFound("Organization not found");
  await deleteOrgById(id);
}

export async function getOrgSettingsService(orgId: string) {
  const row = await getOrgSettings(orgId);
  if (!row) {
    const created = await upsertOrgSettings({
      orgId,
      units: "metric",
      timezone: "UTC",
      preferences: {},
      updatedAt: new Date(),
    });
    return {
      orgId,
      units: created.units ?? "metric",
      timezone: created.timezone ?? "UTC",
      defaultTrainingLocationId: created.defaultTrainingLocationId ?? null,
      preferences: created.preferences ?? {},
      updatedAt: toIso(created.updatedAt),
    };
  }
  return {
    orgId,
    units: row.units ?? "metric",
    timezone: row.timezone ?? "UTC",
    defaultTrainingLocationId: row.defaultTrainingLocationId ?? null,
    preferences: row.preferences ?? {},
    updatedAt: toIso(row.updatedAt),
  };
}

export async function upsertOrgSettingsService(
  orgId: string,
  input: Partial<{
    units: "metric" | "imperial";
    timezone: string;
    defaultTrainingLocationId: string | null;
    preferences: Record<string, unknown>;
  }>
) {
  const existing = await getOrgById(orgId);
  if (!existing) throw new AppError.NotFound("Organization not found");

  const row = await upsertOrgSettings({
    orgId,
    units: input.units,
    timezone: input.timezone,
    defaultTrainingLocationId: input.defaultTrainingLocationId ?? undefined,
    preferences: input.preferences as any,
    updatedAt: new Date(),
  });

  return {
    orgId,
    units: row.units ?? "metric",
    timezone: row.timezone ?? "UTC",
    defaultTrainingLocationId: row.defaultTrainingLocationId ?? null,
    preferences: row.preferences ?? {},
    updatedAt: toIso(row.updatedAt),
  };
}

export async function addMemberService(orgId: string, input: AddMemberInput) {
  const o = await getOrgById(orgId);
  if (!o) throw new AppError.NotFound("Organization not found");

  const already = await getMember(orgId, input.userId);
  if (already)
    throw new AppError.Conflict("User is already a member of the org");

  const row = await addMember({
    orgId,
    userId: input.userId,
    role: input.role,
    clerkMembershipId: input.clerkMembershipId ?? null,
  });

  return {
    id: row.id,
    orgId: row.orgId,
    userId: row.userId,
    role: row.role,
    clerkMembershipId: row.clerkMembershipId ?? null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export async function updateMemberService(
  orgId: string,
  userId: string,
  patch: UpdateMemberInput
) {
  const exists = await getMember(orgId, userId);
  if (!exists) throw new AppError.NotFound("Membership not found");

  const row = await updateMember(orgId, userId, {
    role: patch.role ?? exists.role,
  });

  return {
    id: row!.id,
    orgId: row!.orgId,
    userId: row!.userId,
    role: row!.role,
    clerkMembershipId: row!.clerkMembershipId ?? null,
    createdAt: toIso(row!.createdAt),
    updatedAt: toIso(row!.updatedAt),
  };
}

export async function removeMemberService(orgId: string, userId: string) {
  const exists = await getMember(orgId, userId);
  if (!exists) throw new AppError.NotFound("Membership not found");
  await removeMember(orgId, userId);
}

export async function listMembersService(orgId: string) {
  const rows = await listMembers(orgId);
  return rows.map((r) => ({
    id: r.id,
    orgId: r.orgId,
    userId: r.userId,
    role: r.role,
    clerkMembershipId: r.clerkMembershipId ?? null,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
    user: r.user
      ? { id: r.user.id, email: r.user.email, fullName: r.user.fullName }
      : undefined,
  }));
}
