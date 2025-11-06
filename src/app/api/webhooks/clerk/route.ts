// src/app/api/webhooks/clerk/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/infrastructure/db/client";
import { userAccount, org, orgMember } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { mapClerkRoleToApp } from "@/features/auth/roleMap";

export const runtime = "nodejs"; // Drizzle/pg typically needs Node, not Edge

async function getOrCreateUserByClerk(data: any) {
  const email: string | null = data.email_addresses?.[0]?.email_address ?? null;

  // Clerk always has an id
  const clerkUserId: string = data.id;

  if (!email) {
    // if you truly can't proceed without email, bail out
    throw new Error("Clerk user has no primary email.");
  }

  // Try update by clerkUserId first
  const updated = await db
    .update(userAccount)
    .set({
      email,
      fullName:
        [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
      avatarUrl: data.image_url ?? null,
      // updatedAt auto-defaults, but set() is ok too if you want
    })
    .where(eq(userAccount.clerkUserId, clerkUserId))
    .returning();

  if (updated.length) return updated[0];

  // Else insert; if email exists (unique), upsert via email unique
  const inserted = await db
    .insert(userAccount)
    .values({
      // id is auto (uuid)
      clerkUserId,
      email,
      fullName:
        [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
      avatarUrl: data.image_url ?? null,
    })
    .onConflictDoUpdate({
      target: userAccount.email, // unique on email
      set: {
        clerkUserId, // attach clerk id later if email pre-existed
        fullName:
          [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
        avatarUrl: data.image_url ?? null,
      },
    })
    .returning();

  return inserted[0];
}

async function upsertOrgByClerk(data: any) {
  // your 'org' table uses: id (uuid), clerkOrgId (text), name, ownerUserId?
  const clerkOrgId: string = data.id;
  const name: string = data.name ?? "Unnamed";

  // You do not have a unique on clerkOrgId; do "update then insert"
  const updated = await db
    .update(org)
    .set({ name })
    .where(eq(org.clerkOrgId, clerkOrgId))
    .returning();

  if (updated.length) return updated[0];

  const inserted = await db
    .insert(org)
    .values({
      // id auto
      clerkOrgId,
      name,
      // ownerUserId can be set later based on membership if you want
    })
    .returning();

  return inserted[0];
}

async function upsertMembership(data: any) {
  // data.organization.id (Clerk), data.public_user_data.user_id (Clerk user), data.id (membership id), data.role
  const clerkOrgId: string = data.organization?.id;
  const clerkUserId: string = data.public_user_data?.user_id;
  const clerkMembershipId: string = data.id;
  const appRole = mapClerkRoleToApp(data.role);

  // Resolve our org.id from clerkOrgId
  const orgRow = await db.query.org.findFirst({
    where: eq(org.clerkOrgId, clerkOrgId),
    columns: { id: true },
  });
  if (!orgRow) throw new Error("Org not found for membership.");

  // Resolve our user.id from userAccount.clerkUserId
  const userRow = await db.query.userAccount.findFirst({
    where: eq(userAccount.clerkUserId, clerkUserId),
    columns: { id: true },
  });
  if (!userRow) throw new Error("User not found for membership.");

  // Try update existing membership by clerkMembershipId
  const updated = await db
    .update(orgMember)
    .set({ role: appRole })
    .where(eq(orgMember.clerkMembershipId, clerkMembershipId))
    .returning();

  if (updated.length) return updated[0];

  // Else ensure no duplicate for same org+user (unique enforced in schema)
  const inserted = await db
    .insert(orgMember)
    .values({
      // id auto (uuid)
      orgId: orgRow.id,
      userId: userRow.id,
      role: appRole,
      clerkMembershipId,
    })
    .onConflictDoUpdate({
      target: [orgMember.orgId, orgMember.userId], // ux_org_member_org_user
      set: { role: appRole, clerkMembershipId },
    })
    .returning();

  return inserted[0];
}

type SvixHeaders = {
  "svix-id": string;
  "svix-timestamp": string;
  "svix-signature": string;
};

export async function POST(req: Request) {
  // --- Read raw payload & headers ---
  const payload = await req.text();
  const hdrs = req.headers;
  const svixHeaders: SvixHeaders = {
    "svix-id": hdrs.get("svix-id") ?? "",
    "svix-timestamp": hdrs.get("svix-timestamp") ?? "",
    "svix-signature": hdrs.get("svix-signature") ?? "",
  };

  // --- Verify signature ---
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  let evt: any;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, svixHeaders);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const type: string = evt.type;

  try {
    switch (type) {
      case "user.created":
      case "user.updated": {
        await getOrCreateUserByClerk(evt.data);
        break;
      }

      case "user.deleted": {
        const clerkUserId: string = evt.data.id;
        await db
          .delete(userAccount)
          .where(eq(userAccount.clerkUserId, clerkUserId));
        break;
      }

      case "organization.created":
      case "organization.updated": {
        await upsertOrgByClerk(evt.data);
        break;
      }

      case "organizationMembership.created":
      case "organizationMembership.updated": {
        await upsertMembership(evt.data);
        break;
      }

      case "organizationMembership.deleted": {
        const clerkMembershipId: string = evt.data.id;
        // delete by clerkMembershipId (not by our uuid id)
        await db
          .delete(orgMember)
          .where(eq(orgMember.clerkMembershipId, clerkMembershipId));
        break;
      }

      default:
        // no-op for other events
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Log as needed
    return NextResponse.json(
      { error: e?.message ?? "Unhandled error" },
      { status: 500 }
    );
  }
}
