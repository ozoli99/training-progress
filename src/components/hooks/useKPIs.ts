import { useMemo } from "react";

type VolumeSet = { reps?: number | null; weight?: number | null };
type VolumeLog = { sets?: VolumeSet[] | null };

const setVolume = (set: VolumeSet) => (set.reps ?? 0) * (set.weight ?? 0);
const logVolume = (log: VolumeLog) =>
  (log.sets ?? []).reduce((sum, s) => sum + setVolume(s), 0);

export function useKPIs<T extends VolumeLog>(logs: readonly T[] | undefined) {
  return useMemo(() => {
    const safe = logs ?? [];
    const sessions = safe.length;
    const volume = safe.reduce((sum, log) => sum + logVolume(log), 0);
    return { sessions, volume } as const;
  }, [logs]);
}
