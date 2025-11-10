"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TrendSeries = { labels: string[]; values: number[] };
type Kpis = {
  totalSessions: number;
  totalVolumeKg: number;
  totalDurationS: number;
  avgRpe: number | null;
  avgCompletionPct: number | null;
};
type Summary = {
  kpis: Kpis;
  charts: { trend: TrendSeries };
  nextUp: {
    total: number;
    items: { id: string; sessionDate: string; title?: string }[];
  };
};

export default function AthleteDashboard({
  orgId,
  athleteId,
}: {
  orgId: string;
  athleteId: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        // Keep using the same summary endpoint; let the server branch on role.
        const r = await fetch(`/api/orgs/${orgId}/dashboard/summary`, {
          cache: "no-store",
        });
        if (!r.ok) throw new Error("summary failed");
        const j = (await r.json()) as Summary;
        if (!abort) setData(j);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {greeting}! Stay consistent this week.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/org/${orgId}/sessions?filter=today`)}
          >
            Log today
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/org/${orgId}/athletes/${athleteId ?? ""}/measurements`
              )
            }
          >
            Update measurements
          </Button>
        </div>
      </div>

      {/* Simple KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 h-24" />
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Sessions</div>
                <div className="text-xl font-semibold">
                  {Number(k?.totalSessions ?? 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Volume</div>
                <div className="text-xl font-semibold">
                  {Number(k?.totalVolumeKg ?? 0).toLocaleString()} kg
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Adherence</div>
                <div className="text-xl font-semibold">
                  {Number(k?.avgCompletionPct ?? 0).toFixed(0)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Avg RPE</div>
                <div className="text-xl font-semibold">{k?.avgRpe ?? "—"}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Trend placeholder (swap to your charts component if you want) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">My training trend</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {trend.length ? "Trend data loaded." : "No trend yet."}
        </CardContent>
      </Card>

      {/* Next Up */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Next Up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(data?.nextUp.items ?? []).slice(0, 3).map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {new Date(s.sessionDate).toLocaleDateString()} —{" "}
                {s.title ?? "Session"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/org/${orgId}/sessions/${s.id}`)}
              >
                View
              </Button>
            </div>
          ))}
          {!data?.nextUp.items?.length && (
            <div className="text-muted-foreground">No sessions scheduled.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
