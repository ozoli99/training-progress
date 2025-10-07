"use client";

import { Unit } from "@/lib/types";
import {
  tickFmt,
  fullDate,
  unitLabel,
  getTrendColor,
  isDeltaImproved,
  formatMetric,
  formatDelta,
  isTimeUnit,
} from "@/lib/utils";

type Props = {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  weekly?: boolean;
  unit: Unit;
  isOneRm: boolean;
  prevMap: Map<string, number>;
};

export function DefaultTooltip({
  active,
  payload,
  label,
  weekly,
  unit,
  isOneRm,
  prevMap,
}: Props) {
  if (!active || !payload?.length) return null;

  const labelStr = String(label);
  const v = Number(payload[0].value ?? 0);
  const prev = prevMap.get(labelStr) ?? 0;
  const delta = v - prev;

  const isImproved = isDeltaImproved(delta, unit);
  const isTime = isTimeUnit(unit);
  const timeDeltaWord = isTime ? (isImproved ? "slower" : "faster") : undefined;

  return (
    <div className="rounded-lg border bg-popover text-popover-foreground p-3 shadow-md">
      <div className="text-xs text-muted-foreground">
        {weekly ? `Week of ${tickFmt(labelStr)}` : fullDate(labelStr)}
      </div>
      <div className="mt-1 text-sm font-medium">
        {formatMetric(v, unit, isOneRm)}{" "}
        {unit !== "time" && (
          <span className="text-muted-foreground">
            {unitLabel(unit, isOneRm)}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs">
        <span className={getTrendColor(isImproved, unit)}>
          {isImproved ? "▲" : "▼"} {formatDelta(delta, unit)}
        </span>{" "}
        {isTime ? (
          <>
            {timeDeltaWord} vs prev{weekly ? " week" : ""}
          </>
        ) : (
          <>vs prev{weekly ? " week" : ""}</>
        )}
      </div>
    </div>
  );
}
