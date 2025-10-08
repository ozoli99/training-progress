"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/TrendChart";
import { KPI } from "@/components/KPI";
import { HeaderCard } from "@/components/HeaderCard";
import { Filters } from "@/components/Filters";
import { LogsTable } from "@/components/LogsTable";

import { Log, Metric, Unit } from "@/lib/types";
import { best1RMOf, driveKpis, makeSeries } from "@/lib/training";

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
