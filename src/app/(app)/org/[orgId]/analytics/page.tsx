"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

/* ---------------- Types ---------------- */

type LeaderboardItem = {
  athleteId: string;
  athleteName: string;
  volumeKg: number;
  sessions: number;
};

type SessionLite = {
  id: string;
  athleteName: string;
  sessionDate: string; // ISO
  title?: string | null;
  status?: string | null;
  completionPct?: number | null;
};

type SummaryResponse = {
  kpis: {
    sessions7d: number;
    sessionsTrend: number;
    avgVolume: number;
    volumeTrend: number;
    adherence: number;
    adherenceTrend: number;
    activeAthletes30d: number;
    activeTrend: number;
  };
  charts: {
    weeklyVolume: number[];
    movementCounts: number[];
    completionTrend: number[];
  };
  leaderboard: {
    items: LeaderboardItem[];
    total: number;
  };
  topMovements: { name: string; count: number }[];
  nextUp: {
    items: SessionLite[];
    total: number;
  };
  meta: {
    ranges: {
      kpis: { from: string; to: string };
      trend: { from: string; to: string; weeks: number };
      nextUp: { from: string; to: string };
    };
  };
};

// NOTE: params is a Promise on Next.js 15+ in Client Components
type PageProps = { params: Promise<{ orgId: string }> };

/* ---------------- UI bits ---------------- */

function Sparkline({ points = [] as number[] }) {
  const safe = points.length ? points : [0, 1, 0, 1, 0, 1, 0, 1];
  const max = Math.max(...safe, 1);
  const width = 96;
  const height = 28;
  const step = width / (safe.length - 1 || 1);
  const d = safe
    .map((p, i) => {
      const x = i * step;
      const y = height - (p / max) * height;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function KPICard({
  label,
  value,
  suffix,
  trend,
  spark = [],
}: {
  label: string;
  value: number;
  suffix?: string;
  trend: number;
  spark?: number[];
}) {
  const positive = trend >= 0;
  return (
    <Card className="h-24 shadow-sm">
      <CardContent className="h-full flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">
            {Number.isFinite(value) ? value.toLocaleString() : "—"}
            {suffix ? (
              <span className="text-sm text-muted-foreground"> {suffix}</span>
            ) : null}
          </div>
          <div
            className={cn(
              "text-xs",
              positive ? "text-emerald-600" : "text-rose-600"
            )}
            aria-label={`trend ${positive ? "up" : "down"} ${Math.abs(trend)}%`}
          >
            {positive ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </div>
        </div>
        <div className="text-muted-foreground">
          <Sparkline points={spark} />
        </div>
      </CardContent>
    </Card>
  );
}

function LineChart({
  title,
  series = [],
  ySuffix,
}: {
  title: string;
  series?: number[];
  ySuffix?: string;
}) {
  const width = 640;
  const height = 220;
  const safe = series.length ? series : [0, 0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  const step = width / (safe.length - 1 || 1);
  const d = safe
    .map((p, i) => {
      const x = i * step;
      const y = height - (p / max) * height;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <svg width={width} height={height} role="img" aria-label={title}>
          <line
            x1="0"
            y1={height}
            x2={width}
            y2={height}
            stroke="currentColor"
            strokeOpacity="0.2"
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={height}
            stroke="currentColor"
            strokeOpacity="0.2"
          />
          <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
          {safe.map((p, i) => {
            const x = i * step;
            const y = height - (p / max) * height;
            return <circle key={i} cx={x} cy={y} r="3" fill="currentColor" />;
          })}
          {safe.length > 0 && (
            <text
              x={width}
              y={height - (safe.at(-1)! / max) * height - 6}
              textAnchor="end"
              className="text-xs"
            >
              {safe.at(-1)!.toLocaleString()}
              {ySuffix ?? ""}
            </text>
          )}
        </svg>
      </CardContent>
    </Card>
  );
}

function Leaderboard({ items = [] as LeaderboardItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Top Athletes (by volume)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No data.</div>
          ) : (
            items.map((it, i) => (
              <div
                key={it.athleteId}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 grid place-items-center text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-medium">{it.athleteName}</div>
                    <div className="text-xs text-muted-foreground">
                      {it.sessions} sessions
                    </div>
                  </div>
                </div>
                <div className="font-mono">
                  {Math.round(it.volumeKg).toLocaleString()} kg
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TopMovements({
  items = [] as { name: string; count: number }[],
}: {
  items?: { name: string; count: number }[];
}) {
  const total = items.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Top Movements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data.</div>
        ) : (
          items.map((m) => {
            const pct = (m.count / total) * 100;
            return (
              <div key={m.name}>
                <div className="flex items-center justify-between text-sm">
                  <span>{m.name}</span>
                  <span className="text-muted-foreground">{m.count}</span>
                </div>
                <div className="h-2 w-full rounded bg-muted">
                  <div
                    className="h-2 rounded bg-primary"
                    style={{ width: `${pct}%` }}
                    aria-label={`${m.name} ${pct.toFixed(1)}%`}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function NextUp({
  items = [] as SessionLite[],
  orgId,
}: {
  items?: SessionLite[];
  orgId: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Next Up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {items.length === 0 ? (
          <div className="text-muted-foreground">No upcoming sessions.</div>
        ) : (
          items.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {new Date(s.sessionDate).toLocaleDateString()} —{" "}
                {s.title ?? "Session"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  (location.href = `/org/${orgId}/sessions/${s.id}`)
                }
              >
                View
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------- Page (Client Component) ---------------------- */

export default function AnalyticsPage({ params }: PageProps) {
  // ✅ Unwrap route params
  const { orgId } = React.use(params);

  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`/api/orgs/${orgId}/analytics/summary`, {
          cache: "no-store",
          headers: { "cache-control": "no-store" },
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(`Failed: ${res.status} ${msg}`);
        }
        const json = (await res.json()) as SummaryResponse;
        if (!abort) setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [orgId]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return "Burning the midnight oil?";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const k = data?.kpis;
  const c = data?.charts;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {greeting}! Here’s a snapshot of your org.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => (location.href = `/org/${orgId}/sessions`)}>
            Plan session
          </Button>
          <Button
            variant="outline"
            onClick={() => (location.href = `/org/${orgId}/log`)}
          >
            Log workout
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !k ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <KPICard
                label="Total Sessions (7d)"
                value={k.sessions7d}
                trend={k.sessionsTrend}
                spark={c?.movementCounts ?? []}
              />
              <KPICard
                label="Avg Volume / Session"
                value={k.avgVolume}
                suffix="kg"
                trend={k.volumeTrend}
                spark={c?.weeklyVolume ?? []}
              />
              <KPICard
                label="Adherence"
                value={k.adherence}
                suffix="%"
                trend={k.adherenceTrend}
                spark={c?.completionTrend ?? []}
              />
              <KPICard
                label="Active Athletes (30d)"
                value={k.activeAthletes30d}
                trend={k.activeTrend}
                spark={c?.movementCounts ?? []}
              />
            </>
          )}
        </div>
      </section>

      <Separator />

      {/* Main grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts column */}
        <div className="xl:col-span-2 space-y-6">
          <LineChart
            title="Weekly Training Volume"
            series={c?.weeklyVolume ?? []}
            ySuffix=" kg"
          />
          <LineChart
            title="Session Completion Trend"
            series={c?.completionTrend ?? []}
            ySuffix=" %"
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {loading ? (
            <>
              <Skeleton className="h-44" />
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </>
          ) : (
            <>
              <Leaderboard items={data?.leaderboard?.items ?? []} />
              <TopMovements items={data?.topMovements ?? []} />
              <NextUp orgId={orgId} items={data?.nextUp?.items ?? []} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
