"use client";

import { SeriesPoint } from "@/lib/types";
import { ResponsiveContainer, LineChart, Line } from "recharts";

export default function InlineSparkline({
  data,
  className,
}: {
  data: SeriesPoint[];
  className?: string;
}) {
  const size = className ?? "h-16 w-56";
  return (
    <div className={size}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
        >
          <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
