import { Unit } from "./types";

export const AXIS_CLASS = "text-xs fill-muted-foreground";
export const GRID_CLASS = "stroke-muted";

export const BAR_MARGIN = { top: 8, right: 8, bottom: 0, left: 8 } as const;
export const LINE_MARGIN = { top: 8, right: 64, bottom: 0, left: 8 } as const;

export const DEFAULT_SET_BY_UNIT: Record<Unit, Record<string, number>> = {
  time: { timeSec: 30, rpe: 6 },
  reps: { reps: 8, rpe: 7 },
  weight_reps: { reps: 5, weight: 50, rpe: 8 },
};
