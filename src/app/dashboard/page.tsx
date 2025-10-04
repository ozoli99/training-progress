"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useTrainingFilters } from "@/ui/hooks/useTrainingFilters";
import { WeeklyVolumeChart } from "@/ui/components/charts/WeeklyVolumeChart";
import { useKPIs } from "@/ui/hooks/useKPIs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
    const { state, dispatch } = useTrainingFilters();

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["logs", state],
        queryFn: async () => {
            const url = `/api/logs?start=${state.start}&end=${state.end}`;
            return await (await fetch(url)).json();
        },
    });

    const { sessions, volume } = useKPIs(logs);

    const weekly = groupByWeek(logs);

    return (
        <div className="grid gap-6">
            <div className="grid sm:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Sessions</div><div className="text-2xl font-semibold">{sessions}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Volume</div><div className="text-2xl font-semibold">{Math.round(volume)}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Range</div><div className="text-2xl font-semibold">{state.start} → {state.end}</div></CardContent></Card>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div>
                    <Label>Start</Label>
                    <Input type="date" value={state.start} onChange={e => dispatch({ type: "range", start: e.target.value, end: state.end })} />
                </div>
                <div>
                    <Label>End</Label>
                    <Input type="date" value={state.end} onChange={e => dispatch({ type: "range", start: state.start, end: e.target.value })} />
                </div>
                <div>
                    <Label>Metric</Label>
                    <Tabs value={state.metric} onValueChange={v => dispatch({ type: "metric", metric: v as any })}>
                        <TabsList className="w-full">
                            <TabsTrigger value="volume" className="flex-1">Volume</TabsTrigger>
                            <TabsTrigger value="one_rep_max" className="flex-1">Est. 1RM</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    {isLoading ? <div className="h-64 animate-pulse bg-muted rounded-xl" /> : <WeeklyVolumeChart data={weekly} />}
                </CardContent>
            </Card>
        </div>
    );
}

function groupByWeek(logs: any[]) {
    const map = new Map<string, number>();
    for (const log of logs) {
        const week = weekKey(log.date);
        let vol = 0;
        for (const set of log.sets ?? []) {
            if (set.reps && set.weight) {
                vol += set.reps * set.weight;
            }
        }
        map.set(week, (map.get(week) ?? 0) + vol);
    }
    return Array.from(map.entries()).map(([week, volume]) => ({ week, volume })).sort((a, b) => a.week.localeCompare(b.week));
}

function weekKey(isoDate: string) {
    const date = new Date(isoDate + "T00:00:00");
    const day = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - day);
    return date.toISOString().slice(0, 10);
}