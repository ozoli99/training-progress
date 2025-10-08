"use client";

import { num, tickFmt, weekKey } from "@/lib/utils";
import { useId, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DefaultTooltip } from "./DefaultTooltip";
import { Unit, WeeklyPoint } from "@/lib/types";

type Props = {
  data: WeeklyPoint[];
  range: { start: string; end: string };
  height?: number;
  unit?: Unit;
};

export function WeeklyVolumeChart({
  data,
  range,
  height = 288,
  unit = "weight_reps",
}: Props) {
  const gradId = useId();

  const weekKeysInRange: string[] = useMemo(() => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const diff = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const days = Array.from({ length: diff + 1 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    return Array.from(new Set(days.map((day) => weekKey(day))));
  }, [range.start, range.end]);

  const displayData = useMemo(
    () =>
      weekKeysInRange.map((week) => {
        const found = data.find((d) => d.week === week);
        return { week, value: found ? found.value : 0 };
      }),
    [weekKeysInRange, data]
  );

  console.log({ displayData });

  const prevMap = useMemo(
    () =>
      displayData.reduce((map, current, index, array) => {
        if (index > 0) {
          map.set(current.week, array[index - 1].value);
        }
        return map;
      }, new Map<string, number>()),
    [displayData]
  );

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart
          data={displayData}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          barCategoryGap={18}
        >
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
            className="stroke-muted"
          />
          <XAxis
            dataKey="week"
            tickFormatter={tickFmt}
            tickLine={false}
            axisLine={false}
            minTickGap={12}
            interval="preserveStartEnd"
            className="text-xs fill-muted-foreground"
          />
          <YAxis
            width={48}
            tickFormatter={(v) => num(v)}
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground"
          />
          <Tooltip
            cursor={false}
            content={(props) => (
              <DefaultTooltip
                {...props}
                unit={unit}
                isOneRm={false}
                prevMap={prevMap}
                weekly={true}
              />
            )}
          />
          <Bar
            dataKey="value"
            fill={`url(#${gradId})`}
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
