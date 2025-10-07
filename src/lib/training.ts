import { Log, Metric, Unit } from "./types";

export const estimate1RM = (reps?: number | null, weight?: number | null) =>
  !reps || !weight ? 0 : weight * (1 + reps / 30);

export const volumeOf = (log: Log) =>
  log.sets.reduce(
    (a, s) => a + (s.reps && s.weight ? s.reps * s.weight : 0),
    0
  );

export const best1RMOf = (log: Log) =>
  Math.max(0, ...log.sets.map((s) => estimate1RM(s.reps, s.weight)));

export const totalTimeOf = (log: Log) =>
  log.sets.reduce((a, s) => a + (s.timeSec ?? 0), 0);

// TODO: Log["exercise"]["unit"]?
export function makeSeries(logs: Log[], metric: Metric, unit: Unit) {
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

// TODO: Does unit need to be passed here?
export function driveKpis(logs: Log[], unit: Unit) {
  const sessions = logs.length;
  const totalVolume = logs.reduce((a, l) => a + volumeOf(l), 0);
  const best1RM = Math.max(0, ...logs.map(best1RMOf));
  const totalTime = logs.reduce((a, l) => a + totalTimeOf(l), 0);
  const latest = logs[logs.length - 1];

  return { sessions, totalVolume, best1RM, totalTime, latest, unit };
}
