// app/dashboard/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarCheck, GaugeCircle, PlusCircle } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import NewMeasurementDialog from "@/components/athletes/NewMeasurementDialog";
import MeasurementTable from "@/components/athletes/MeasurementTable";

// keep your chart imports as-is if these are named exports in your codebase
import { WeeklyVolumeChart } from "@/components/charts/WeeklyVolumeChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { OneRMLineChart } from "@/components/charts/OneRMLineChart";

import { useKPIs } from "@/components/hooks/useKPIs";

// ---------------- Derived data builders for charts ----------------
type VolumeSet = { reps?: number | null; weight?: number | null };
type VolumeLog = {
  sets?: VolumeSet[] | null;
  createdAt?: string | null;
  sessionDate?: string | null;
  title?: string | null;
};

function setVolume(s: VolumeSet) {
  const r = s.reps ?? 0;
  const w = s.weight ?? 0;
  return r * w;
}
function logVolume(log: VolumeLog) {
  const sets = log.sets ?? [];
  return sets.reduce((sum, s) => sum + setVolume(s), 0);
}
function safeDateStr(log: VolumeLog) {
  return (log.sessionDate || log.createdAt || new Date().toISOString())!;
}

// --- WeeklyVolumeChart adapters ---

/** Convert logs -> WeeklyPoint[]: { week: "YYYY-Www", value: number } */
function toWeeklyPoints(logs: readonly VolumeLog[]) {
  const byWeek = new Map<string, number>();
  for (const l of logs) {
    const d = new Date(safeDateStr(l));
    const wk = isoWeekKey(d); // e.g. 2025-W45
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + logVolume(l));
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([week, value]) => ({ week, value })); // ✅ WeeklyPoint shape
}

/** Build a { start, end } range covering the last `n` whole ISO weeks up to today */
function lastNWeeksRange(n: number): { start: string; end: string } {
  const today = new Date();
  const end = endOfIsoWeek(today); // end of current ISO week (Sun 23:59:59.999 UTC-ish)
  const start = startOfIsoWeek(addDays(end, -(n - 1) * 7)); // go back n-1 weeks, take week start
  return {
    start: start.toISOString().slice(0, 10), // YYYY-MM-DD
    end: end.toISOString().slice(0, 10),
  };
}

// --- tiny date helpers used above ---
function startOfIsoWeek(d: Date) {
  const copy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (copy.getUTCDay() + 6) % 7; // 0..6 with Monday=0
  copy.setUTCDate(copy.getUTCDate() - day);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}
function endOfIsoWeek(d: Date) {
  const start = startOfIsoWeek(d);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}
function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/** TrendChart adapter – simple daily volume series */
function buildTrendSeries(logs: readonly VolumeLog[]) {
  const byDay = new Map<string, number>();
  for (const l of logs) {
    const d = new Date(safeDateStr(l));
    const day = d.toISOString().slice(0, 10); // YYYY-MM-DD
    byDay.set(day, (byDay.get(day) ?? 0) + logVolume(l));
  }
  const series = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, y]) => ({ x: date, y }));
  return series;
}

/** OneRMLineChart adapter – reuse daily volume as a line; swap to true 1RM later */
type SeriesPoint = { x: string; y: number; label?: string };
function buildOneRMSeries(logs: readonly VolumeLog[]): SeriesPoint[] {
  return buildTrendSeries(logs).map((p) => ({ x: p.x, y: p.y }));
}
function computeYDomainFromSeries(
  series: ReadonlyArray<{ y: number }>
): [number, number] {
  if (!series.length) return [0, 1];
  const ys = series.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const pad = (max - min || 1) * 0.1;
  return [Math.max(0, min - pad), max + pad];
}
function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** util: ISO week key like 2025-W45 */
function isoWeekKey(d: Date) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1..Sunday=7)
  const dayNum = (dt.getUTCDay() + 6) % 7; // 0..6 where 0=Monday
  dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(((dt.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

type TrainingLog = VolumeLog & {
  id: string;
  title?: string | null;
  sessionDate?: string | null;
  createdAt?: string | null;
  summary?: string | null;
};

/* -------------------- Helpers -------------------- */
function ensureArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// small display helper
function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid gap-0.5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold leading-none">{value}</div>
      {hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

const READINESS_TYPES = [
  "hrv_ms",
  "sleep_h",
  "resting_hr",
  "wellness",
] as const;
type ReadinessKey = (typeof READINESS_TYPES)[number];

/* -------------------- Data hooks -------------------- */
function useDevAthleteId() {
  const [athleteId, setAthleteId] = React.useState("");
  React.useEffect(() => {
    setAthleteId(localStorage.getItem("dev_athlete_id") || "");
  }, []);
  return athleteId;
}

function useRecentLogs(athleteId: string, limit = 10) {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (athleteId) qs.set("athleteId", athleteId);

  // ✅ Type the query result as TrainingLog[]
  return useQuery<TrainingLog[]>({
    queryKey: ["logs", { athleteId, limit }],
    queryFn: async () => {
      const res = await api(`/api/logs?${qs.toString()}`);
      // extra safety if backend returns unknown shape
      return ensureArray<TrainingLog>(res);
    },
  });
}

function useReadiness(athleteId: string) {
  return useQuery({
    enabled: !!athleteId,
    queryKey: ["readiness", athleteId],
    queryFn: async () => {
      const results: Record<
        ReadinessKey,
        { value: number | string | null; measuredAt?: string } | null
      > = { hrv_ms: null, sleep_h: null, resting_hr: null, wellness: null };

      await Promise.all(
        READINESS_TYPES.map(async (type) => {
          try {
            const rows = await api(
              `/api/athletes/${athleteId}/measurements?type=${type}&limit=1&offset=0&order=desc`
            );
            const arr = ensureArray<any>(rows);
            const first = arr[0];
            if (first) {
              results[type] = {
                value: first.valueNum ?? first.valueJson ?? null,
                measuredAt: first.measuredAt,
              };
            }
          } catch {
            // noop: leave null
          }
        })
      );
      return results;
    },
  });
}

/* -------------------- Page -------------------- */
export default function DashboardPage() {
  const athleteId = useDevAthleteId();

  const {
    data: recentLogs = [], // ✅ now typed TrainingLog[]
    isLoading: logsLoading,
  } = useRecentLogs(athleteId, 20);

  // ✅ Derive KPIs from typed array (matches your useKPIs signature)
  const simpleKpis = useKPIs(recentLogs);

  const { data: readiness, isLoading: readinessLoading } =
    useReadiness(athleteId);

  const [measurementsReloadKey, bumpReloadKey] = React.useReducer(
    (n) => n + 1,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Plan smart, train consistently, and track progress with confidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/log">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Training Log
            </Button>
          </Link>
          <NewMeasurementDialog
            athleteId={athleteId}
            onCreated={() => bumpReloadKey()}
          />
        </div>
      </section>

      {/* KPI row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {logsLoading ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">
                  Volume (window)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Stat
                  label=""
                  value={formatNumber(simpleKpis.volume)}
                  hint="kg total (recent)"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">
                  Sessions (window)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Stat
                  label=""
                  value={simpleKpis.sessions}
                  hint="count (recent)"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">
                  Weekly Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-2">
                  Rolling trend
                </div>
                <WeeklyVolumeChart
                  data={toWeeklyPoints(recentLogs)}
                  range={lastNWeeksRange(8)}
                  height={120}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">
                  Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Stat label="" value="—" hint="streak (wire later)" />
              </CardContent>
            </Card>
          </>
        )}
      </section>

      {/* Readiness + Strength trend */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              <GaugeCircle className="h-4 w-4" />
              Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4">
            {readinessLoading ? (
              <>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-32" />
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <ReadinessCell
                  label="HRV"
                  value={fmt(readiness?.hrv_ms?.value)}
                  unit="ms"
                />
                <ReadinessCell
                  label="Sleep"
                  value={fmt(readiness?.sleep_h?.value)}
                  unit="h"
                />
                <ReadinessCell
                  label="Resting HR"
                  value={fmt(readiness?.resting_hr?.value)}
                  unit="bpm"
                />
                <ReadinessCell
                  label="Wellness"
                  value={fmt(readiness?.wellness?.value)}
                  unit="/10"
                />
              </div>
            )}

            <Separator />
            <div className="grid gap-3">
              <div className="text-xs text-muted-foreground">
                Trends (placeholder, wire analytics later)
              </div>
              <TrendChart
                series={buildTrendSeries(recentLogs)}
                metric="volume"
                unit="weight_reps"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Strength: 1RM Estimates</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <OneRMLineChart
              series={buildOneRMSeries(recentLogs)}
              yDomain={computeYDomainFromSeries(buildOneRMSeries(recentLogs))}
              prevMap={new Map<string, number>()}
              unit="weight_reps"
              showAverage={true}
              yVals={buildOneRMSeries(recentLogs).map((p) => p.y)}
              avg={avg(buildOneRMSeries(recentLogs).map((p) => p.y))}
              emphasizePR={true}
            />
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity + Measurements */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {logsLoading ? (
              <RecentActivitySkeleton />
            ) : recentLogs.length ? (
              <ul className="space-y-3">
                {recentLogs.map((row) => (
                  <li key={row.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {row.title ?? "Session"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.sessionDate ?? row.createdAt ?? ""}
                      </div>
                    </div>
                    {row.summary ? (
                      <div className="text-sm text-muted-foreground mt-1">
                        {row.summary}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No recent logs"
                description="Start tracking your training to see activity here."
                cta={
                  <Link href="/log">
                    <Button size="sm">Add your first log</Button>
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Recent Measurements</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <MeasurementTable
              key={measurementsReloadKey}
              athleteId={athleteId}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/* -------------------- Tiny UI helpers -------------------- */
function ReadinessCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">
        {value}{" "}
        {value !== "—" && unit ? (
          <span className="text-sm text-muted-foreground">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 rounded-md" />
      <Skeleton className="h-16 rounded-md" />
      <Skeleton className="h-16 rounded-md" />
    </div>
  );
}

function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-6 text-center">
      <div className="text-base font-medium">{title}</div>
      {description ? (
        <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      ) : null}
      {cta ? <div className="mt-3">{cta}</div> : null}
    </div>
  );
}

function fmt(v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? `${v}` : v.toFixed(1);
  return String(v);
}

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}
