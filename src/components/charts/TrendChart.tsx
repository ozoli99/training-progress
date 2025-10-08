"use client";

import { useMemo } from "react";
import { SeriesPoint, Unit } from "@/lib/types";
import { VolumeBarChart } from "./VolumeBarChart";
import { OneRMLineChart } from "./OneRMLineChart";

type Props = {
  series: SeriesPoint[];
  metric: "volume" | "one_rm";
  unit: Unit;
  height?: number;
  showAverage?: boolean;
  emphasizePR?: boolean;
};

export function TrendChart({ series, metric, unit }: Props) {
  const isBar = metric === "volume";

  const yVals = series.map((p) => Number(p.y)).filter(Number.isFinite);
  const minY = yVals.length ? Math.min(...yVals) : 0;
  const maxY = yVals.length ? Math.max(...yVals) : 0;
  const range = maxY - minY;
  const pad = range === 0 ? Math.max(1, maxY * 0.1 || 1) : range * 0.1;

  const avg = yVals.length
    ? yVals.reduce((a, b) => a + b, 0) / yVals.length
    : 0;

  const prevMap = useMemo(
    () =>
      series.reduce((map, current, index, array) => {
        if (index > 0) {
          map.set(current.x, array[index - 1].y);
        }
        return map;
      }, new Map<string, number>()),
    [series]
  );

  const yDomain: [any, any] = [
    () => Math.max(0, Math.floor(minY - pad)),
    () => Math.ceil(maxY + pad),
  ];

  return (
    <div
      className="w-full h-[288px] text-[hsl(var(--primary))]"
      aria-label={
        metric === "one_rm"
          ? "Estimated 1RM trend"
          : unit === "time"
            ? "Total time trend"
            : "Volume trend"
      }
    >
      {isBar ? (
        <VolumeBarChart
          series={series}
          yDomain={yDomain}
          prevMap={prevMap}
          unit={unit}
          showAverage={true}
          yVals={yVals}
          avg={avg}
        />
      ) : (
        <OneRMLineChart
          series={series}
          yDomain={yDomain}
          prevMap={prevMap}
          unit={unit}
          showAverage={true}
          yVals={yVals}
          avg={avg}
          emphasizePR={true}
        />
      )}
    </div>
  );
}
