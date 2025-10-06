"use client";

import { BAR_MARGIN, GRID_CLASS, AXIS_CLASS } from "@/lib/constants";
import { SeriesPoint, Unit } from "@/lib/types";
import { getVariant, tickFmt } from "@/lib/utils";
import { useId } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Bar,
  BarChart,
} from "recharts";
import { DefaultTooltip } from "./DefaultTooltip";

export function VolumeBarChart({
  series,
  yDomain,
  prevMap,
  unit,
  showAverage,
  yVals,
  avg,
}: {
  series: SeriesPoint[];
  yDomain: [any, any];
  prevMap: Map<string, number>;
  unit: Unit;
  showAverage: boolean;
  yVals: number[];
  avg: number;
}) {
  const gradId = useId();

  return (
    <ResponsiveContainer>
      <BarChart data={series} margin={BAR_MARGIN} barCategoryGap={18}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.9}
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.35}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
          className={GRID_CLASS}
        />
        <XAxis
          dataKey="x"
          tickFormatter={tickFmt}
          tickLine={false}
          axisLine={false}
          minTickGap={12}
          interval="preserveStartEnd"
          className={AXIS_CLASS}
        />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          domain={yDomain}
          className={AXIS_CLASS}
        />
        <Tooltip
          cursor={false}
          content={(props) => (
            <DefaultTooltip
              {...props}
              unit={unit}
              isOneRm={false}
              prevMap={prevMap}
              weekly={false}
            />
          )}
        />
        {showAverage && yVals.length > 0 && (
          <ReferenceLine
            y={avg}
            stroke="currentColor"
            strokeDasharray="6 6"
            strokeOpacity={0.35}
            ifOverflow="extendDomain"
          />
        )}
        <Bar
          dataKey="y"
          fill={`url(#${gradId})`}
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
