import { db } from "@/infrastructure/db/client";
import { exercises, sessionLogs } from "@/infrastructure/db/schema";
import { sql } from "drizzle-orm";
import InlineSparkline from "./InlineSparkline";
import { SeriesPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

// TODO: Fix the Log types
type Log = {
  date: string;
  id: string;
  createdAt: Date;
  exerciseId: string;
  notes: string | null;
  sets: {
    id: string;
    sessionLogId: string;
    reps: number | null;
    weight: number | null;
    timeSec: number | null;
    rpe: number | null;
  }[];
};

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function HeroLiveStats({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [{ c: exCount }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(exercises);
  const [{ c: logCount }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(sessionLogs);

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);

  const logs = await db.query.sessionLogs.findMany({
    where: (l, { gte, lte, and }) =>
      and(gte(l.date, ymd(start)), lte(l.date, ymd(end))),
    with: { sets: true },
  });

  const setVolume = (s: Log["sets"][number]) => (s.reps ?? 0) * (s.weight ?? 0);

  const logVolume = (log: Log) =>
    log.sets.reduce((sum, s) => sum + setVolume(s), 0);

  const dayMap = logs.reduce<Map<string, number>>((map, log) => {
    const vol = logVolume(log);
    map.set(log.date, (map.get(log.date) ?? 0) + vol);
    return map;
  }, new Map());

  const spark: SeriesPoint[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = ymd(cursor);
    spark.push({ x: key, y: dayMap.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div className={cn(compact ? "" : "mt-5", className)}>
      <div className="w-[200px] sm:w-[240px]">
        <InlineSparkline data={spark} />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Last 30 days volume</span>
          <span aria-hidden className="mx-1">
            •
          </span>
          <span>{exCount ?? 0} exercises</span>
          <span aria-hidden className="mx-1">
            •
          </span>
          <span>{logCount ?? 0} logs</span>
        </div>
      </div>
    </div>
  );
}
