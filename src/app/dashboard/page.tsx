"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useTrainingFilters } from "@/ui/hooks/useTrainingFilters";
import { WeeklyVolumeChart } from "@/ui/components/charts/WeeklyVolumeChart";
import { useKPIs } from "@/ui/hooks/useKPIs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Activity, TrendingUp, CalendarRange, Divide } from "lucide-react";

function estimate1RM(reps?: number, weight?: number) {
  if (!reps || !weight) return 0;
  return weight * (1 + reps / 30);
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function clampRange(start: string, end: string) {
  return new Date(start) <= new Date(end) ? { start, end } : { start: end, end: start };
}

export default function DashboardPage() {
    const { state, dispatch } = useTrainingFilters();
    const safeRange = clampRange(state.start, state.end);

    const { data: logs = [], isLoading, isError, error } = useQuery({
        queryKey: ["logs", safeRange],
        queryFn: async () => {
            const url = `/api/logs?start=${safeRange.start}&end=${safeRange.end}`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Failed to fetch: ${res.status}`);
            }
            return (await res.json()) as any[];
        },
        staleTime: 10_000,
    });

    const exerciseOptions = React.useMemo(() => {
        const map = new Map<string, string>();
        for (const log of logs) {
            const name = log?.exercise?.name as string | undefined;
            if (name) {
                map.set(log.exerciseId, name);
            }
        }
        const items = Array.from(map, ([id, name]) => ({ id, name }));
        return [{ id: "all", name: "All Exercises" }, ...items];
    }, [logs]);

    const [exerciseId, setExerciseId] = React.useState<string>("all");

    const filteredLogs = React.useMemo(() => (
        exerciseId === "all" ? logs : logs.filter(log => log.exerciseId === exerciseId)
    ), [logs, exerciseId]);

    const { sessions, volume } = useKPIs(filteredLogs);

    const weekly = React.useMemo(() => {
        const map = new Map<string, number>();
        for (const log of filteredLogs) {
            const week = weekKey(log.date);
            let val = 0;
            if (state.metric === "volume") {
                for (const s of log.sets ?? []) {
                    if (s.reps && s.weight) {
                        val += s.reps * s.weight;
                    }
                }
            } else {
                let best = 0;
                for (const s of log.sets ?? []) {
                    best = Math.max(best, estimate1RM(s.reps, s.weight));
                }
                val = best;
            }
            map.set(week, (map.get(week) ?? 0) + val);
        }
        return Array.from(map.entries()).map(([week, value]) => ({ week, value })).sort((a, b) => a.week.localeCompare(b.week));
    }, [filteredLogs, state.metric]);

    const onExportCSV = React.useCallback(() => {
        const rows = [["week", state.metric], ...weekly.map((r) => [r.week, String(Math.round(r.value))])];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dashboard_${state.metric}_${safeRange.start}_${safeRange.end}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [weekly, state.metric, safeRange]);

    const applyPreset = (days: number) => {
        const end = new Date();
        const start = addDays(end, -days + 1);
        dispatch({ type: "range", start: ymd(start), end: ymd(end) });
    };

    return (
        <div className="grid gap-6">
            <div className="grid sm:grid-cols-3 gap-4">
                <KPICard
                    icon={<Activity className="h-4 w-4" />}
                    label="Sessions"
                    value={sessions.toLocaleString()}
                />
                <KPICard
                    icon={<TrendingUp className="h-4 w-4" />}
                    label={state.metric === "volume" ? "Total Volume" : "Max Est. 1RM (weekly sum)"}
                    value={
                        (state.metric === "volume"
                            ? Math.round(volume)
                            : Math.round(weekly.reduce((acc, w) => acc + w.value, 0))
                        ).toLocaleString()
                    }
                />
                <KPICard
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Avg. Weekly Volume"
                    value={Math.round(volume / (weekly.length || 1)).toLocaleString()}
                />
            </div>

            <div className="grid md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3">
                    <Label>Start</Label>
                    <Input type="date" value={safeRange.start} onChange={e => dispatch({ type: "range", start: e.target.value, end: safeRange.end })} />
                </div>
                <div className="md:col-span-3">
                    <Label>End</Label>
                    <Input type="date" value={safeRange.end} onChange={e => dispatch({ type: "range", start: safeRange.start, end: e.target.value })} />
                </div>
                <div className="md:col-span-3">
                    <Label>Exercise</Label>
                    <Select value={exerciseId} onValueChange={setExerciseId}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Exercises" />
                        </SelectTrigger>
                        <SelectContent>
                            {exerciseOptions.map((ex) => (
                                <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="md:col-span-3">
                    <Label>Metric</Label>
                    <Tabs value={state.metric} onValueChange={v => dispatch({ type: "metric", metric: v as any })}>
                        <TabsList className="w-full">
                            <TabsTrigger value="volume" className="flex-1">Volume</TabsTrigger>
                            <TabsTrigger value="one_rep_max" className="flex-1">Est. 1RM</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="md:col-span-9 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => applyPreset(28)}>Last 4 weeks</Button>
                    <Button size="sm" variant="outline" onClick={() => applyPreset(56)}>Last 8 weeks</Button>
                    <Button size="sm" variant="outline" onClick={() => applyPreset(84)}>Last 12 weeks</Button>
                </div>

                <div className="md:col-span-3 flex md:justify-end">
                    <Button size="sm" variant="secondary" onClick={onExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    {isLoading && <div className="h-64 animate-pulse bg-muted rounded-xl" />}
                    {isError && (
                        <div className="h-64 grid place-items-center rounded-xl border text-sm text-red-600">
                            Failed to load data{(error as Error)?.message ? ` - ${(error as Error).message}` : ""}.
                        </div>
                    )}
                    {!isLoading && !isError && weekly.length === 0 && (
                        <div className="h-64 grid place-items-center rounded-xl border text-sm text-muted-foreground">
                            No data in this range. Try expanding the range or logging a session.
                        </div>
                    )}
                    {!isLoading && !isError && weekly.length > 0 && (
                        <WeeklyVolumeChart data={weekly.map((w) => ({ week: w.week, volume: Math.round(w.value) }))} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function weekKey(isoDate: string) {
    const date = new Date(isoDate + "T00:00:00");
    const day = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - day);
    return date.toISOString().slice(0, 10);
}

function KPICard({ icon, label, value, subtle }: { icon: React.ReactNode; label: string; value: React.ReactNode; subtle?: string }) {
    return (
        <Card
            className={[
                "relative transition-all",
                "hover:-translate-y-0.5 hover:shadow-lg",
                "focus-within:ring-2 focus-within:ring-primary/60",
            ].join(" ")}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
            />
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-accent/30 text-accent-foreground">
                        {icon}
                    </span>
                    <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                        <div className="mt-1 text-2xl font-semibold leading-tight">{value}</div>
                        {subtle && <div className="mt-1 text-xs text-muted-foreground">{subtle}</div>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}