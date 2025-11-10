import { NextResponse } from "next/server";
import { z } from "zod";
import { analyticsService } from "@/features/analytics/service";
import { getAuthContext } from "@/features/auth/context";
import { orgsService } from "@/features/orgs/service";

const Query = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  weeks: z.coerce.number().int().min(1).max(26).default(8),
  leaderboardLimit: z.coerce.number().int().min(1).max(20).default(5),
});

const Params = z.object({ orgId: z.string() });

function fmtDateOnly(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addWeeks(d: Date, n: number) {
  return addDays(d, n * 7);
}
function parseDateOrUndefined(v?: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    const detail = e?.issues
      ? JSON.stringify(e.issues)
      : (e?.message ?? String(e));
    throw new Error(`[${label}] ${detail}`);
  }
}

export async function GET(req: Request, ctx: { params: { orgId: string } }) {
  try {
    const { orgId } = Params.parse(ctx.params);

    // Auth & org guard (both may be UUID or Clerk id)
    const auth = await getAuthContext();
    if (!auth.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (auth.orgId !== orgId)
      return NextResponse.json({ error: "Org mismatch" }, { status: 403 });

    // --- NEW: resolve or create (auto-sync) org in our DB ---
    // 1) Try resolve (UUID or Clerk id)
    let resolved = await orgsService.resolveOrgByAnyId({
      orgIdOrClerkId: orgId,
    });

    // 2) If not found and it *looks* like a Clerk id, upsert from Clerk info then resolve again
    if (!resolved && orgId.startsWith("org_")) {
      // Try to get a friendly name from auth context if you have it there; safe fallbacks otherwise
      const fallbackName =
        (auth as any)?.orgName ||
        (auth as any)?.org?.name ||
        "New Organization";
      await orgsService.upsertOrgFromClerk({
        clerkOrgId: orgId,
        name: fallbackName,
        // ownerUserId is optional in your DTO; omit if unknown
      });
      resolved = await orgsService.resolveOrgByAnyId({ orgIdOrClerkId: orgId });
    }

    if (!resolved) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }
    const orgUuid = resolved.id; // <- internal UUID from your DB

    // Parse query
    const url = new URL(req.url);
    const q = Query.parse({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      weeks: url.searchParams.get("weeks") ?? undefined,
      leaderboardLimit: url.searchParams.get("leaderboardLimit") ?? undefined,
    });

    // Ranges (service expects YYYY-MM-DD strings)
    const now = new Date();
    const kpiFromD =
      parseDateOrUndefined(q.from) ?? startOfDay(addDays(now, -6));
    const kpiToD = parseDateOrUndefined(q.to) ?? endOfDay(now);
    const trendFromD = startOfDay(addWeeks(now, -q.weeks + 1));
    const trendToD = endOfDay(now);
    const nextFromD = startOfDay(now);
    const nextToD = endOfDay(addDays(now, 2));

    const rangeKpiStr = {
      from: fmtDateOnly(kpiFromD),
      to: fmtDateOnly(kpiToD),
    };
    const rangeTrendStr = {
      from: fmtDateOnly(trendFromD),
      to: fmtDateOnly(trendToD),
    };
    const rangeNextStr = {
      from: fmtDateOnly(nextFromD),
      to: fmtDateOnly(nextToD),
    };

    // Queries (now using orgUuid)
    const kpisRaw = await step("getDashboardKpis", () =>
      analyticsService.getDashboardKpis({ orgId: orgUuid, range: rangeKpiStr })
    );

    const trendSeries = await step("getAthleteTrend", () =>
      analyticsService.getAthleteTrend({ orgId: orgUuid, range: rangeTrendStr })
    );

    const leaderboard = await step("getLeaderboard", () =>
      analyticsService.getLeaderboard({
        orgId: orgUuid,
        range: rangeKpiStr,
        limit: q.leaderboardLimit,
        offset: 0,
      })
    );

    const nextSessions = await step("getSessions", () =>
      analyticsService.getSessions({
        orgId: orgUuid,
        range: rangeNextStr,
        limit: 5,
        offset: 0,
      })
    );

    // Shape transforms for the client
    const pts = (trendSeries as any)?.points ?? [];
    const labels: string[] = pts.map((p: any) => p.day ?? "");
    const values: number[] = pts.map((p: any) =>
      Number(p.rolling7dVolumeKg ?? p.volumeKg ?? 0)
    );

    const nextUp = {
      total: (nextSessions as any)?.total ?? nextSessions?.items?.length ?? 0,
      items:
        (nextSessions as any)?.items?.map((s: any) => ({
          id: s.sessionId ?? s.id,
          athleteId: s.athleteId,
          athleteName: s.athleteName ?? s.athlete?.displayName ?? undefined,
          sessionDate: s.sessionDate,
          title: s.title ?? null,
          status: s.status ?? null,
        })) ?? [],
    };

    return NextResponse.json({
      kpis: kpisRaw,
      charts: { trend: { labels, values } },
      leaderboard,
      nextUp,
      meta: {
        ranges: {
          kpis: rangeKpiStr,
          trend: { ...rangeTrendStr, weeks: q.weeks },
          nextUp: rangeNextStr,
        },
      },
    });
  } catch (e: any) {
    console.error("[dashboard/summary] 500:", e);
    const message = e?.message ?? "Server error";
    return NextResponse.json(
      { error: "Server error", detail: message },
      { status: 500 }
    );
  }
}
