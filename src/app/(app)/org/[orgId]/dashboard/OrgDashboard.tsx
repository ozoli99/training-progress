"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type ServiceKpis = {
  totalSessions: number;
  completedSessions: number;
  totalSets: number;
  totalVolumeKg: number;
  totalDurationS: number;
  avgRpe: number | null;
  avgCompletionPct: number | null;
};

type TrendSeries = { labels: string[]; values: number[] };

type SummaryResponse = {
  kpis: ServiceKpis;
  charts: { trend: TrendSeries };
  leaderboard: unknown;
  nextUp: {
    total: number;
    items: Array<{
      id: string;
      sessionDate: string;
      athleteId: string;
      athleteName?: string;
      title?: string;
      status?: string | null;
    }>;
  };
  meta: unknown;
};

/* Tiny sparkline */
function Sparkline({ points = [] as number[] }) {
  const safe = points.length ? points : [0, 1, 0, 1, 0, 1, 0, 1];
  const max = Math.max(...safe, 1);
  const width = 80,
    height = 24;
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
    <Card className="h-24">
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
            className={`text-xs ${positive ? "text-emerald-600" : "text-rose-600"}`}
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

function ChartCard({
  title,
  series = [],
  ySuffix,
}: {
  title: string;
  series?: number[];
  ySuffix?: string;
}) {
  const width = 640,
    height = 220;
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

export default function OrgDashboard({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`/api/orgs/${orgId}/dashboard/summary`, {
          method: "GET",
          headers: { "cache-control": "no-store" },
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
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
  const trend = data?.charts.trend.values ?? [];
  const avgVolumePerSession =
    k && k.totalSessions ? Number(k.totalVolumeKg) / k.totalSessions : 0;
  const adherencePct = Number(k?.avgCompletionPct ?? 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {greeting}! Here’s a snapshot of your org.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/org/${orgId}/sessions`)}>
            Plan session
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/org/${orgId}/log`)}
          >
            Log workout
          </Button>
        </div>
      </div>

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
                label="Total Sessions (range)"
                value={k.totalSessions}
                trend={0}
                spark={trend}
              />
              <KPICard
                label="Avg Volume / Session"
                value={avgVolumePerSession}
                suffix="kg"
                trend={0}
                spark={trend}
              />
              <KPICard
                label="Adherence"
                value={adherencePct}
                suffix="%"
                trend={0}
                spark={trend}
              />
              <KPICard
                label="Completed Sessions"
                value={k.completedSessions}
                trend={0}
                spark={trend}
              />
            </>
          )}
        </div>
      </section>

      <Separator />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <ChartCard title="Athlete Trend (series)" series={trend} />
          <ChartCard
            title="Volume Proxy (same trend series)"
            series={trend}
            ySuffix=" units"
          />
          <ChartCard
            title="Completion Proxy (same trend series)"
            series={trend}
            ySuffix=" %"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => router.push(`/org/${orgId}/sessions`)}>
                  Plan session
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/org/${orgId}/log`)}
                >
                  Log workout
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/org/${orgId}/athletes`)}
                >
                  Add athlete
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Next Up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(data?.nextUp.items ?? []).slice(0, 2).map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {new Date(s.sessionDate).toLocaleDateString()} —{" "}
                    {s.title ?? "Session"}
                    {s.athleteName ? ` — ${s.athleteName}` : ""}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      router.push(`/org/${orgId}/sessions/${s.id}`)
                    }
                  >
                    View
                  </Button>
                </div>
              ))}
              {(data?.nextUp.items?.length ?? 0) === 0 && (
                <div className="text-muted-foreground">
                  No sessions in the next 3 days.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Goals & Gaps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Keep consistency above 80% and target +5% volume next week.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/org/${orgId}/analytics`)}
              >
                Open Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
