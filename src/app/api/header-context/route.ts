// src/app/api/header-context/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/infrastructure/db/client";
import {
  org,
  orgMember,
  orgSettings,
  athleteVisibility,
  athlete,
  plannedSession,
  message,
  messageRead,
  trainingLocation, // make sure this is exported from your schema index
} from "@/infrastructure/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export async function GET() {
  // Next 15: auth() is async
  const { userId, orgId: clerkOrgId } = await auth();
  if (!userId) return NextResponse.json({ user: null, orgs: [] });

  // Get memberships; select clerkOrgId so we can compute "current" in JS
  const memberships = await db
    .select({
      orgId: org.id,
      name: org.name,
      role: orgMember.role,
      clerkOrgId: org.clerkOrgId,
    })
    .from(orgMember)
    .innerJoin(org, eq(orgMember.orgId, org.id))
    .where(eq(orgMember.userId, userId as unknown as string));

  const current =
    memberships.find((m) => m.clerkOrgId === clerkOrgId) ??
    memberships[0] ??
    null;

  // Defaults
  let units: "metric" | "imperial" = "metric";
  let timezone = "UTC";
  let defaultTrainingLocation: null | { id: string; name: string } = null;

  if (current) {
    const [s] = await db
      .select({
        units: orgSettings.units,
        timezone: orgSettings.timezone,
        defaultTrainingLocationId: orgSettings.defaultTrainingLocationId,
      })
      .from(orgSettings)
      .where(eq(orgSettings.orgId, current.orgId));

    if (s?.units) units = s.units as any;
    if (s?.timezone) timezone = s.timezone!;

    if (s?.defaultTrainingLocationId) {
      const row = await db
        .select({ id: trainingLocation.id, name: trainingLocation.name })
        .from(trainingLocation)
        .where(eq(trainingLocation.id, s.defaultTrainingLocationId))
        .limit(1);
      if (row[0]) defaultTrainingLocation = row[0];
    }
  }

  // Athletes I can log for
  let athletesICanLogFor: Array<{ id: string; displayName: string }> = [];
  if (current) {
    const vis = await db
      .select({ athleteId: athleteVisibility.athleteId })
      .from(athleteVisibility)
      .where(
        and(
          eq(athleteVisibility.userId, userId as unknown as string),
          eq(athleteVisibility.canLog, true)
        )
      );

    if (vis.length) {
      const ids = vis.map((v) => v.athleteId);
      const rows = await db
        .select({ id: athlete.id, displayName: athlete.displayName })
        .from(athlete)
        .where(eq(athlete.orgId, current!.orgId));
      athletesICanLogFor = rows.filter((r) => ids.includes(r.id));
    }
  }

  // Counts: plannedToday + unreadMessages
  let plannedToday = 0;
  let unreadMessages = 0;

  if (current) {
    // planned_session.planned_date is a DATE (string in Drizzle) — compare as YYYY-MM-DD
    const today = new Date();
    const toStr = (d: Date) => d.toISOString().slice(0, 10);
    const todayStr = toStr(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = toStr(tomorrow);

    const planned = await db
      .select({ id: plannedSession.id })
      .from(plannedSession)
      .where(
        and(
          eq(plannedSession.orgId, current.orgId),
          gte(plannedSession.plannedDate, todayStr),
          lte(plannedSession.plannedDate, tomorrowStr)
        )
      );
    plannedToday = planned.length;

    // TODO: implement unread by scoping conversations/participants to this user/org.
    // For now, keep it safe:
    unreadMessages = 0;
  }

  return NextResponse.json({
    user: { id: userId, email: "" }, // extend if needed
    orgs: memberships.map((m) => ({ id: m.orgId, name: m.name })),
    currentOrg: current ? { id: current.orgId, name: current.name } : null,
    role: (current?.role ?? null) as any,
    units,
    timezone,
    defaultTrainingLocation,
    athletesICanLogFor,
    counts: { plannedToday, unreadMessages },
  });
}
