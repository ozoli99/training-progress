"use client";

import { Unit } from "@/lib/types";
import { tickFmt, fullDate, num, unitLabel, getTrendColor } from "@/lib/utils";

function formatSeconds(totalSec: number) {
  if (!Number.isFinite(totalSec)) return "0:00";

  const sign = totalSec < 0 ? "-" : "";
  let s = Math.abs(Math.round(totalSec));
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return h > 0
    ? `${sign}${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${sign}${m}:${String(sec).padStart(2, "0")}`;
}

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

  const improved = unit === "time" ? delta >= 0 : delta <= 0;

  const valueDisplay = unit === "time" ? formatSeconds(v) : num(v);
  const deltaDisplay =
    unit === "time" ? formatSeconds(Math.abs(delta)) : num(Math.abs(delta));

  const timeDeltaWord =
    unit === "time" ? (improved ? "slower" : "faster") : undefined;

  return (
    <div className="rounded-lg border bg-popover text-popover-foreground p-3 shadow-md">
      <div className="text-xs text-muted-foreground">
        {weekly ? `Week of ${tickFmt(labelStr)}` : fullDate(labelStr)}
      </div>
      <div className="mt-1 text-sm font-medium">
        {valueDisplay}{" "}
        {unit !== "time" && (
          <span className="text-muted-foreground">
            {unitLabel(unit, isOneRm)}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs">
        <span className={getTrendColor(improved, unit)}>
          {improved ? "▲" : "▼"} {deltaDisplay}
        </span>{" "}
        {unit === "time" ? (
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
