// features/auth/context.ts
import { cookies as getCookies, headers as getHeaders } from "next/headers";
import { AppError } from "@/shared/errors";
import { db } from "@/infrastructure/db/client";
import {
  org,
  orgMember,
  userAccount as userTable,
} from "@/infrastructure/db/schema";
import { and, eq } from "drizzle-orm";

type Role = "owner" | "admin" | "coach" | "athlete";
export type AuthCtx = {
  userId: string;
  orgId: string;
  role: Role;
  clerkUserId?: string;
};

const ORG_HEADER = "x-org-id";
const USER_HEADER = "x-user-id";
const ORG_COOKIE = "active_org_id";
const DEV_USER_COOKIE = "dev_user_id";
const USE_CLERK = process.env.AUTH_WITH_CLERK === "true";

async function getHeadersAndCookies() {
  const h0 = getHeaders() as any;
  const c0 = getCookies() as any;
  const h = typeof h0?.then === "function" ? await h0 : h0;
  const c = typeof c0?.then === "function" ? await c0 : c0;
  return { h, c } as {
    h: Headers;
    c: ReadonlyMap<string, { value: string }> & {
      get(name: string): { value: string } | undefined;
    };
  };
}

async function readHints() {
  const { h, c } = await getHeadersAndCookies();
  const orgFromHdr = h.get(ORG_HEADER)?.trim() || null;
  const userFromHdr = h.get(USER_HEADER)?.trim() || null;
  const orgFromCookie = c.get(ORG_COOKIE)?.value?.trim() || null;
  const userFromCookie = c.get(DEV_USER_COOKIE)?.value?.trim() || null;
  return {
    hintedOrgId: orgFromHdr || orgFromCookie,
    hintedUserId: userFromHdr || userFromCookie,
  };
}

/* ----------------------------- DEV MODE ----------------------------- */

async function ensureDevUser(hintedUserId: string | null) {
  if (hintedUserId) {
    const u = await db.query.userAccount.findFirst({
      where: eq(userTable.id, hintedUserId),
    });
    if (u) return u.id;
  }
  const existing = await db.query.userAccount.findFirst({});
  if (existing) return existing.id;

  const inserted = await db
    .insert(userTable)
    .values({ email: "dev@example.com", fullName: "Dev User" })
    .returning({ id: userTable.id });

  const newId = inserted[0]?.id;
  if (!newId) throw new Error("Failed to create dev user.");
  return newId;
}

async function resolveActiveOrgId(localUserId: string, hint: string | null) {
  // If a hint is present, ensure the user is a member of that org
  if (hint) {
    const m = await db.query.orgMember.findFirst({
      where: and(eq(orgMember.orgId, hint), eq(orgMember.userId, localUserId)),
    });
    if (m) return hint;
  }

  // Fallback: first org where the user is a member (use FK directly)
  const m = await db.query.orgMember.findFirst({
    where: eq(orgMember.userId, localUserId),
  });
  if (m?.orgId) return m.orgId;

  // No membership yet: pick any existing org (select only id to avoid `never`)
  const rows = await db.select({ id: org.id }).from(org).limit(1);
  const anyOrgId = rows[0]?.id;
  if (!anyOrgId) {
    throw new AppError.Unauthorized(
      "No organizations exist yet. Seed an org or create one first."
    );
  }

  // Attach user as owner to that org
  await db
    .insert(orgMember)
    .values({ orgId: anyOrgId, userId: localUserId, role: "owner" });

  return anyOrgId;
}

async function resolveRole(localUserId: string, orgId: string): Promise<Role> {
  const m = await db.query.orgMember.findFirst({
    where: and(eq(orgMember.userId, localUserId), eq(orgMember.orgId, orgId)),
  });
  if (!m) throw new AppError.Forbidden("You are not a member of this org.");
  const r = m.role as Role;
  return (
    ["owner", "admin", "coach", "athlete"].includes(r) ? r : "athlete"
  ) as Role;
}

/* ----------------------------- CLERK MODE ----------------------------- */

async function ensureLocalUserFromClerk(clerkUserId: string) {
  const mod = await import("@clerk/nextjs/server").catch(() => null as any);
  if (!mod?.clerkClient)
    throw new Error("Clerk not available but AUTH_WITH_CLERK=true.");
  const { clerkClient } = mod;

  const existing = await db.query.userAccount.findFirst({
    where: eq(userTable.clerkUserId, clerkUserId),
  });
  if (existing) return existing.id;

  const cu = await clerkClient.users.getUser(clerkUserId);
  const email =
    cu.emailAddresses?.find((e: any) => e.id === cu.primaryEmailAddressId)
      ?.emailAddress ??
    cu.emailAddresses?.[0]?.emailAddress ??
    "unknown";
  const fullName =
    [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null;
  const avatarUrl = cu.imageUrl || null;

  const rows = await db
    .insert(userTable)
    .values({
      clerkUserId,
      email,
      fullName: fullName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
    })
    .returning({ id: userTable.id });

  const createdId = rows[0]?.id;
  if (!createdId) throw new Error("Failed to create local user for Clerk.");
  return createdId;
}

/* ------------------------------- PUBLIC ------------------------------- */

export async function getAuthCtx(): Promise<AuthCtx> {
  const { hintedOrgId, hintedUserId } = await readHints();

  if (!USE_CLERK) {
    const localUserId = await ensureDevUser(hintedUserId);
    const activeOrgId = await resolveActiveOrgId(localUserId, hintedOrgId);
    const role = await resolveRole(localUserId, activeOrgId);
    return { userId: localUserId, orgId: activeOrgId, role };
  }

  const mod = await import("@clerk/nextjs/server").catch(() => null as any);
  if (!mod?.auth)
    throw new Error("Clerk not available but AUTH_WITH_CLERK=true.");
  const { userId: clerkUserId } = mod.auth();
  if (!clerkUserId) throw new AppError.Unauthorized("Sign in required.");

  const localUserId = await ensureLocalUserFromClerk(clerkUserId);
  const activeOrgId = await resolveActiveOrgId(localUserId, hintedOrgId);
  const role = await resolveRole(localUserId, activeOrgId);
  return { userId: localUserId, orgId: activeOrgId, role, clerkUserId };
}

export function assertRole(ctx: AuthCtx, allowed: Role[]) {
  if (!allowed.includes(ctx.role))
    throw new AppError.Forbidden("You don't have permission for this action.");
}

export async function getOrgScopedAuth() {
  const ctx = await getAuthCtx();
  return { orgId: ctx.orgId, userId: ctx.userId, role: ctx.role };
}
