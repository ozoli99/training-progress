import type { GetLogsDTO } from "@/components/hooks/api/logs";
import type { Metric, WeeklyPoint } from "./types";
import { weekKey } from "./utils";
import { estimate1RM } from "./training";

export function buildExerciseOptions(logs: GetLogsDTO[]) {
  const items = logs
    .map((log) => ({
      id: log.exerciseId,
      name: log.exercise?.name,
    }))
    .filter((i): i is { id: string; name: string } => Boolean(i.id && i.name));
  const uniqueItems = items.filter(
    (item, index, self) => self.findIndex((i) => i.id === item.id) === index
  );
  return [{ id: "all", name: "All Exercises" }, ...uniqueItems];
}

export function groupByWeek(logs: GetLogsDTO[], metric: Metric): WeeklyPoint[] {
  const logsByWeek = logs.reduce<Record<string, GetLogsDTO[]>>((acc, log) => {
    const weekStartDate = weekKey(log.date || "");
    acc[weekStartDate] = acc[weekStartDate]
      ? [...acc[weekStartDate], log]
      : [log];
    return acc;
  }, {});

  const rows = Object.entries(logsByWeek).map(([weekStartDate, logsInWeek]) => {
    const aggregatedValue = logsInWeek.reduce((total, log) => {
      if (metric === "volume") {
        return (
          total +
          (log.sets ?? []).reduce(
            (setTotal, set) =>
              setTotal + (set.reps && set.weight ? set.reps * set.weight : 0),
            0
          )
        );
      } else {
        const best1RM = (log.sets ?? []).reduce(
          (max1RM, set) => Math.max(max1RM, estimate1RM(set.reps, set.weight)),
          0
        );
        return total + best1RM;
      }
    }, 0);
    return { week: weekStartDate, value: aggregatedValue };
  });

  return rows.sort((a, b) => a.week.localeCompare(b.week));
}
