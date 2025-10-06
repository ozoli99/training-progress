"use client";

import { LINE_MARGIN, GRID_CLASS, AXIS_CLASS } from "@/lib/constants";
import { SeriesPoint, Unit } from "@/lib/types";
import { tickFmt, getVariant, fullDate } from "@/lib/utils";
import { useId } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Area,
  Line,
  LineChart,
  ReferenceDot,
} from "recharts";
import { DefaultTooltip } from "./DefaultTooltip";

export function OneRMLineChart({
  series,
  yDomain,
  prevMap,
  unit,
  showAverage,
  yVals,
  avg,
  emphasizePR,
}: {
  series: SeriesPoint[];
  yDomain: [any, any];
  prevMap: Map<string, number>;
  unit: Unit;
  showAverage: boolean;
  yVals: number[];
  avg: number;
  emphasizePR: boolean;
}) {
  const lineGradId = useId();

  const pr = yVals.length ? Math.max(...yVals) : 0;
  const prIdx = pr > 0 ? series.findIndex((p) => p.y === pr) : -1;
  const prPoint = prIdx >= 0 ? series[prIdx] : null;

  return (
    <ResponsiveContainer>
      <LineChart data={series} margin={LINE_MARGIN}>
        <defs>
          <linearGradient id={lineGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" className={GRID_CLASS} />
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
              isOneRm={true}
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
        <Area
          type="monotone"
          dataKey="y"
          stroke="transparent"
          fill={`url(#${lineGradId})`}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="y"
          stroke="currentColor"
          strokeOpacity={0.95}
          strokeWidth={2.5}
          dot={{ r: 2 }}
          activeDot={{ r: 4 }}
          connectNulls
          isAnimationActive
        />
        {emphasizePR && prPoint && (
          <ReferenceDot
            x={prPoint.x}
            y={prPoint.y}
            r={5}
            fill="currentColor"
            stroke="var(--background)"
            strokeWidth={2}
            ifOverflow="hidden"
          />
        )}
        {emphasizePR && pr > 0 && (
          <ReferenceLine
            y={pr}
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeDasharray="2 6"
            ifOverflow="extendDomain"
            label={{
              value: `PR ${Math.round(pr)}`,
              position: "insideRight",
              fill: "currentColor",
              fontSize: 11,
              offset: 8,
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
