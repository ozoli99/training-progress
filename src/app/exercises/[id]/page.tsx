"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrendChart } from "@/ui/components/charts/TrendChart";
import { Dumbbell, Timer, Hash, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

type Unit = "weight_reps" | "time" | "reps";
type Exercise = { id: string; name: string; unit: Unit };
type Log = {
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

const est1RM = (reps?: number, weight?: number) =>
  !reps || !weight ? 0 : weight * (1 + reps / 30);
const volumeOf = (log: Log) =>
  log.sets.reduce(
    (a, s) => a + (s.reps && s.weight ? s.reps * s.weight : 0),
    0
  );
const best1RMOf = (log: Log) =>
  Math.max(0, ...log.sets.map((s) => est1RM(s.reps, s.weight)));
const totalTimeOf = (log: Log) =>
  log.sets.reduce((a, s) => a + (s.timeSec ?? 0), 0);

function unitMeta(unit: Unit) {
  switch (unit) {
    case "weight_reps":
      return {
        label: "weight × reps",
        icon: <Dumbbell className="h-4 w-4" />,
        help: "Load and repetitions per set.",
      };
    case "time":
      return {
        label: "time",
        icon: <Timer className="h-4 w-4" />,
        help: "Track total duration in seconds.",
      };
    default:
      return {
        label: "reps",
        icon: <Hash className="h-4 w-4" />,
        help: "Count-only movements.",
      };
  }
}

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 120);
    return d.toISOString().slice(0, 10);
  });

  const [metric, setMetric] = useState<"volume" | "one_rm">("one_rm");

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
  console.log({ unit });
  const meta = unitMeta(unit);

  const series = useMemo(() => {
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
  }, [logs, metric, unit]);

  const sessions = logs.length;
  const totalVolume = logs.reduce((a, l) => a + volumeOf(l), 0);
  const best1RM = Math.max(0, ...logs.map(best1RMOf));
  const totalTime = logs.reduce((a, l) => a + totalTimeOf(l), 0);
  const latest = logs[logs.length - 1];

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-gradient-to-b from-muted/60 to-background p-6 md:p-8 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20px 20px, hsl(var(--muted-foreground)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              {derivedName}
            </h2>
            <div className="mt-2 inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border bg-muted px-2 py-0.5 text-xs capitalize">
                {meta.icon} {meta.label}
              </span>
              <span className="text-xs text-muted-foreground">{meta.help}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/log?exerciseId=${id}`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Log
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
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
      </div>

      <div className="grid md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3">
          <Label>Start</Label>
          <Input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <Label>End</Label>
          <Input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="md:col-span-6">
          <Label>Metric</Label>
          <Tabs
            value={metric}
            onValueChange={(v) => setMetric(v as "volume" | "one_rm")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="one_rm" className="flex-1">
                Est. 1RM
              </TabsTrigger>
              <TabsTrigger value="volume" className="flex-1">
                {unit === "time" ? "Total Time" : "Volume"}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

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

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="[&>th]:py-2 [&>th]:px-3 text-left">
                <th>Date</th>
                {unit !== "time" ? <th>Best Set</th> : <th>Total Time</th>}
                {unit !== "time" && <th>Volume</th>}
                <th className="hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 12)
                .map((l) => {
                  const vol = volumeOf(l);
                  const bestSet = best1RMOf(l);
                  const totalTime = totalTimeOf(l);
                  return (
                    <tr key={l.id} className="border-t">
                      <td className="py-2 px-3 tabular-nums">{l.date}</td>
                      {unit !== "time" ? (
                        <td className="py-2 px-3">
                          {Math.round(bestSet).toLocaleString()} kg (est. 1RM)
                        </td>
                      ) : (
                        <td className="py-2 px-3">
                          {Math.round(totalTime / 60)} min
                        </td>
                      )}
                      {unit !== "time" && (
                        <td className="py-2 px-3">
                          {Math.round(vol).toLocaleString()}
                        </td>
                      )}
                      <td className="py-2 px-3 hidden sm:table-cell text-muted-foreground">
                        —
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({
  label,
  value,
  subtle,
}: {
  label: string;
  value: React.ReactNode;
  subtle?: string;
}) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold leading-tight">{value}</div>
        {subtle && (
          <div className="mt-1 text-xs text-muted-foreground">{subtle}</div>
        )}
      </CardContent>
    </Card>
  );
}
