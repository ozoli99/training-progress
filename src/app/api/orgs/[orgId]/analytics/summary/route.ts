// app/api/orgs/[orgId]/analytics/summary/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { analyticsService } from "@/features/analytics/service";
import { getAuthContext } from "@/features/auth/context";

const Query = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  weeks: z.coerce.number().int().min(1).max(26).default(8),
  leaderboardLimit: z.coerce.number().int().min(1).max(20).default(5),
});

const Params = z.object({ orgId: z.string() });

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

export async function GET(req: Request, ctx: { params: { orgId: string } }) {
  try {
    const { orgId } = Params.parse(ctx.params);

    // Auth + org check
    const auth = await getAuthContext();
    if (!auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (auth.orgId !== orgId) {
      return NextResponse.json({ error: "Org mismatch" }, { status: 403 });
    }

    // Query
    const url = new URL(req.url);
    const q = Query.parse({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      weeks: url.searchParams.get("weeks") ?? undefined,
      leaderboardLimit: url.searchParams.get("leaderboardLimit") ?? undefined,
    });

    const now = new Date();

    // KPI window: defaults to last 7d
    const kpiFrom =
      parseDateOrUndefined(q.from) ?? startOfDay(addDays(now, -6));
    const kpiTo = parseDateOrUndefined(q.to) ?? endOfDay(now);

    // Trend window: last N weeks (inclusive to today)
    const trendFrom = startOfDay(addWeeks(now, -q.weeks + 1));
    const trendTo = endOfDay(now);

    // Next-up window: today .. +2 days
    const nextFrom = startOfDay(now);
    const nextTo = endOfDay(addDays(now, 2));

    const rangeKpi = { from: kpiFrom.toISOString(), to: kpiTo.toISOString() };
    const rangeTrend = {
      from: trendFrom.toISOString(),
      to: trendTo.toISOString(),
    };
    const rangeNext = {
      from: nextFrom.toISOString(),
      to: nextTo.toISOString(),
    };

    // Compose analytics data
    const [kpisRaw, trendSeries, leaderboard, nextSessions] = await Promise.all(
      [
        analyticsService.getDashboardKpis({
          orgId,
          range: rangeKpi,
        }),
        analyticsService.getAthleteTrend({
          orgId,
          range: rangeTrend,
        }),
        analyticsService.getLeaderboard({
          orgId,
          range: rangeKpi,
          limit: q.leaderboardLimit,
          offset: 0,
        }),
        analyticsService.getSessions({
          orgId,
          range: rangeNext,
          limit: 5,
          offset: 0,
        }),
      ]
    );

    // Derivations for the UI from KPI rollups
    const totalSessions = kpisRaw.totalSessions || 0;
    const avgCompletionPct = Number(kpisRaw.avgCompletionPct ?? 0);
    const totalVolumeKg = Number(kpisRaw.totalVolumeKg ?? 0);
    const avgVolumePerSession =
      totalSessions > 0 ? totalVolumeKg / totalSessions : 0;

    // Active athletes (unique in last 30 days) — reuse analyticsService.getSessions instead of sessionsService.list
    const activeFrom = startOfDay(addDays(now, -29));
    const activeTo = endOfDay(now);
    const last30d = await analyticsService.getSessions({
      orgId,
      range: { from: activeFrom.toISOString(), to: activeTo.toISOString() },
      limit: 2000,
      offset: 0,
    });
    const activeCount = new Set((last30d.items ?? []).map((s) => s.athleteId))
      .size;

    // Trend points are under "points"
    const pts = trendSeries?.points ?? [];
    const weeklyVolume = pts.map((p) =>
      Number(p.rolling7dVolumeKg ?? p.volumeKg ?? 0)
    );
    // Placeholder for completion line (swap to a proper completion series when available)
    const completionTrend = pts.map((p) => Number(p.wellnessScore ?? 0));

    // Workout breakdown (workoutType + count)
    const breakdownRows = await analyticsService.getWorkoutBreakdown({
      orgId,
      range: rangeKpi,
    });

    return NextResponse.json({
      kpis: {
        sessions7d: totalSessions,
        sessionsTrend: 0,
        avgVolume: Math.round(avgVolumePerSession),
        volumeTrend: 0,
        adherence: Math.round(avgCompletionPct),
        adherenceTrend: 0,
        activeAthletes30d: activeCount,
        activeTrend: 0,
      },
      charts: {
        weeklyVolume,
        completionTrend,
        movementCounts: breakdownRows.map((r) => Number(r.count ?? 0)),
      },
      leaderboard,
      topMovements: breakdownRows
        .map((r) => ({
          name: r.workoutType ?? "Other",
          count: r.count,
        }))
        .slice(0, 6),
      nextUp: nextSessions,
      meta: {
        ranges: {
          kpis: { from: kpiFrom.toISOString(), to: kpiTo.toISOString() },
          trend: {
            from: trendFrom.toISOString(),
            to: trendTo.toISOString(),
            weeks: q.weeks,
          },
          nextUp: { from: nextFrom.toISOString(), to: nextTo.toISOString() },
        },
      },
    });
  } catch (e: any) {
    // Better diagnostics on 500s
    console.error("[analytics.summary] error:", e);
    const message =
      e?.issues?.[0]?.message || e?.message || "Internal Server Error";
    const detail = e?.issues || e?.stack || String(e);
    return NextResponse.json({ error: message, detail }, { status: 500 });
  }
}
