"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTrainingFilters } from "@/components/hooks/useTrainingFilters";
import { WeeklyVolumeChart } from "@/components/charts/WeeklyVolumeChart";
import { useKPIs } from "@/components/hooks/useKPIs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Activity, TrendingUp, CalendarCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useGetLogs } from "@/components/hooks/api/logs";
import { Toggle } from "@/components/ui/toggle";
import { KPICard } from "@/components/KPICard";
import { addDays, clampRange, ymd } from "@/lib/utils";
import { buildExerciseOptions, groupByWeek } from "@/lib/dashboard";
import { exportWeeklyCSV } from "@/lib/csv";

export default function DashboardPage() {
  const { state, dispatch } = useTrainingFilters();
  const safeRange = clampRange(state.start, state.end);

  const { data: logs = [], isLoading, isError, error } = useGetLogs(safeRange);

  const exerciseOptions = useMemo(() => buildExerciseOptions(logs), [logs]);

  const [exerciseId, setExerciseId] = useState<string>("all");

  const filteredLogs = useMemo(
    () =>
      exerciseId === "all"
        ? logs
        : logs.filter((log) => log.exerciseId === exerciseId),
    [logs, exerciseId]
  );

  const { sessions, volume } = useKPIs(filteredLogs);

  const weekly = useMemo(
    () => groupByWeek(filteredLogs, state.metric),
    [filteredLogs, state.metric]
  );

  const activeWeeks = useMemo(
    () => weekly.filter((w) => w.value > 0).length,
    [weekly]
  );

  const onExportCSV = useCallback(
    () => exportWeeklyCSV(weekly, state.metric, safeRange.start, safeRange.end),
    [weekly, state.metric, safeRange]
  );

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = addDays(end, -days + 1);
    dispatch({ type: "range", start: ymd(start), end: ymd(end) });
  };

  return (
    <div className="grid gap-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <KPICard
          icon={<Activity className="h-4 w-4" />}
          label="Sessions"
          value={sessions.toLocaleString()}
        />
        <KPICard
          icon={<TrendingUp className="h-4 w-4" />}
          label={
            state.metric === "volume" ? "Total Volume" : "Est. 1RM (weekly sum)"
          }
          value={(state.metric === "volume"
            ? Math.round(volume)
            : Math.round(weekly.reduce((acc, w) => acc + w.value, 0))
          ).toLocaleString()}
        />
        <KPICard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg. Weekly Volume"
          value={Math.round(volume / (weekly.length || 1)).toLocaleString()}
        />
        <KPICard
          icon={<CalendarCheck className="h-4 w-4" />}
          label="Active Weeks"
          value={
            <span className="tabular-nums">
              {activeWeeks}{" "}
              <span className="mx-0.5 text-muted-foreground">/</span>{" "}
              {state.numberOfWeeks}
            </span>
          }
          subtle="weeks with training"
        />
      </div>

      <div className="grid md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3">
          <Label>Start</Label>
          <Input
            type="date"
            value={safeRange.start}
            onChange={(e) =>
              dispatch({
                type: "range",
                start: e.target.value,
                end: safeRange.end,
              })
            }
          />
        </div>
        <div className="md:col-span-3">
          <Label>End</Label>
          <Input
            type="date"
            value={safeRange.end}
            onChange={(e) =>
              dispatch({
                type: "range",
                start: safeRange.start,
                end: e.target.value,
              })
            }
          />
        </div>
        <div className="md:col-span-3">
          <Label>Exercise</Label>
          <Select value={exerciseId} onValueChange={setExerciseId}>
            <SelectTrigger>
              <SelectValue placeholder="All Exercises" />
            </SelectTrigger>
            <SelectContent>
              {exerciseOptions.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Label>Metric</Label>
          <Tabs
            value={state.metric}
            onValueChange={(v) =>
              dispatch({ type: "metric", metric: v as any })
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="volume" className="flex-1">
                Volume
              </TabsTrigger>
              <TabsTrigger value="one_rep_max" className="flex-1">
                Est. 1RM
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="md:col-span-9 flex flex-wrap gap-2">
          <Toggle
            size="sm"
            variant="outline"
            pressed={state.numberOfWeeks === 4}
            onClick={() => applyPreset(28)}
          >
            Last 4 weeks
          </Toggle>
          <Toggle
            size="sm"
            variant="outline"
            pressed={state.numberOfWeeks === 8}
            onClick={() => applyPreset(56)}
          >
            Last 8 weeks
          </Toggle>
          <Toggle
            size="sm"
            variant="outline"
            pressed={state.numberOfWeeks === 12}
            onClick={() => applyPreset(84)}
          >
            Last 12 weeks
          </Toggle>
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
          {isLoading && (
            <div className="h-64 animate-pulse bg-muted rounded-xl" />
          )}
          {isError && (
            <div className="h-64 grid place-items-center rounded-xl border text-sm text-red-600">
              Failed to load data
              {(error as Error)?.message
                ? ` - ${(error as Error).message}`
                : ""}
              .
            </div>
          )}
          {!isLoading && !isError && weekly.length === 0 && (
            <div className="h-64 grid place-items-center rounded-xl border text-sm text-muted-foreground">
              No data in this range. Try expanding the range or logging a
              session.
            </div>
          )}
          {!isLoading && !isError && weekly.length > 0 && (
            <WeeklyVolumeChart
              data={weekly.map((w) => ({
                week: w.week,
                value: Math.round(w.value),
              }))}
              range={{ start: state.start, end: state.end }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
