"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { TrendChart } from "@/ui/components/charts/TrendChart";
import { useMemo, useState } from "react";
import { Unit } from "@/lib/types";
import { best1RMOf, totalTimeOf, volumeOf } from "@/lib/utils";
import { KPI } from "@/ui/components/KPI";
import { HeaderCard } from "@/ui/components/HeaderCard";
import { Filters } from "@/ui/components/Filters";
import { LogsTable } from "@/ui/components/LogsTable";

type Exercise = { id: string; name: string; unit: Unit };

export type Log = {
  id: string;
  exerciseId: string;
  date: string;
  exercise?: Exercise;
  sets: Array<{
    weight?: number;
    reps?: number;
    timeSec?: number;
    rpe?: number;
  }>;
};

export type Metric = "volume" | "one_rm";

function makeSeries(logs: Log[], metric: Metric, unit: Unit) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((l) => ({
    x: l.date,
    y:
      metric === "volume"
        ? volumeOf(l)
        : unit === "time"
          ? totalTimeOf(l)
          : best1RMOf(l),
  }));
}

function driveKpis(logs: Log[], unit: Unit) {
  const sessions = logs.length;
  const totalVolume = logs.reduce((a, l) => a + volumeOf(l), 0);
  const best1RM = Math.max(0, ...logs.map(best1RMOf));
  const totalTime = logs.reduce((a, l) => a + totalTimeOf(l), 0);
  const latest = logs[logs.length - 1];

  return { sessions, totalVolume, best1RM, totalTime, latest, unit };
}

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 120);
    return d.toISOString().slice(0, 10);
  });

  const [metric, setMetric] = useState<Metric>("one_rm");

  const { data: logs = [], isLoading } = useQuery<Log[]>({
    queryKey: ["logsByExercise", id, start, end],
    queryFn: async () => {
      const res = await fetch(`/api/logs?start=${start}&end=${end}`);
      if (!res.ok) {
        throw new Error("Failed to load logs");
      }
      const all = (await res.json()) as Log[];
      return all.filter((l) => l.exerciseId === id);
    },
    staleTime: 10_000,
  });

  const derivedName = logs[0]?.exercise?.name ?? "Exercise";
  const unit: Unit = logs[0]?.exercise?.unit ?? "weight_reps";

  const series = useMemo(
    () => makeSeries(logs, metric, unit),
    [logs, metric, unit]
  );

  const { sessions, totalVolume, best1RM, totalTime, latest } = useMemo(
    () => driveKpis(logs, unit),
    [logs, unit]
  );

  return (
    <div className="grid gap-6">
      <HeaderCard id={id} name={derivedName} unit={unit} />
      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="Sessions" value={sessions.toLocaleString()} />
        {unit === "time" ? (
          <KPI
            label="Total Time"
            value={`${Math.round(totalTime / 60).toLocaleString()} min`}
            subtle={`${totalTime} sec`}
          />
        ) : (
          <>
            <KPI
              label="Total Volume"
              value={Math.round(totalVolume).toLocaleString()}
            />
            <KPI
              label="Best Est. 1RM"
              value={Math.round(best1RM).toLocaleString()}
              subtle={
                latest && best1RMOf(latest) === best1RM
                  ? "PR in last session 🎉"
                  : undefined
              }
            />
          </>
        )}
      </div>
      <Filters
        start={start}
        end={end}
        unit={unit}
        metric={metric}
        onChangeStart={setStart}
        onChangeEnd={setEnd}
        onChangeMetric={setMetric}
      />
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="h-72 rounded-xl bg-muted animate-pulse" />
          ) : series.length === 0 ? (
            <div className="h-72 grid place-items-center rounded-xl border text-sm text-muted-foreground">
              No sessions in this range.
            </div>
          ) : (
            <TrendChart series={series} metric={metric} unit={unit} />
          )}
        </CardContent>
      </Card>
      <LogsTable logs={logs} unit={unit} />
    </div>
  );
}
