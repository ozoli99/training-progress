import { Log, Metric, Unit } from "./types";

export const estimate1RM = (reps?: number | null, weight?: number | null) =>
  !reps || !weight ? 0 : weight * (1 + reps / 30);

export const volumeOf = (log: Log, unit: Unit) => {
  if (unit === "reps") {
    return log.sets.reduce((a, s) => a + (s.reps ?? 0), 0);
  }
  if (unit === "weight_reps") {
    return log.sets.reduce(
      (a, s) => a + (s.reps && s.weight ? s.reps * s.weight : 0),
      0
    );
  }
  return 0;
};

export const best1RMOf = (log: Log, unit: Unit) =>
  unit !== "weight_reps"
    ? 0
    : Math.max(0, ...log.sets.map((s) => estimate1RM(s.reps, s.weight)));

export const totalTimeOf = (log: Log) =>
  log.sets.reduce((a, s) => a + (s.timeSec ?? 0), 0);

export function makeSeries(logs: Log[], metric: Metric, unit: Unit) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((l) => ({
    x: l.date,
    y:
      metric === "volume"
        ? volumeOf(l, unit)
        : unit === "time"
          ? totalTimeOf(l)
          : best1RMOf(l, unit),
  }));
}

export function driveKpis(logs: Log[], unit: Unit) {
  const sessions = logs.length;
  const totalVolume = logs.reduce((a, l) => a + volumeOf(l, unit), 0);
  const best1RM =
    unit !== "weight_reps"
      ? 0
      : Math.max(0, ...logs.map((l) => best1RMOf(l, unit)));
  const totalTime = logs.reduce((a, l) => a + totalTimeOf(l), 0);
  const latest = logs[logs.length - 1];

  return { sessions, totalVolume, best1RM, totalTime, latest, unit };
}
