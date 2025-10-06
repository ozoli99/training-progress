"use client";

import { Unit } from "@/lib/types";
import { tickFmt, fullDate, num, unitLabel, getVariant } from "@/lib/utils";

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
  const up = delta >= 0;

  return (
    <div className="rounded-lg border bg-popover text-popover-foreground p-3 shadow-md">
      <div className="text-xs text-muted-foreground">
        {weekly ? `Week of ${tickFmt(labelStr)}` : fullDate(labelStr)}
      </div>
      <div className="mt-1 text-sm font-medium">
        {num(v)}{" "}
        <span className="text-muted-foreground">
          {unitLabel(unit, isOneRm)}
        </span>
      </div>
      <div className="mt-1 text-xs">
        <span className={getVariant(up, unit)}>
          {up ? "▲" : "▼"} {num(Math.abs(delta))}
        </span>{" "}
        vs prev{weekly ? " week" : ""}
      </div>
    </div>
  );
}
