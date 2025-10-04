"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });

type Point = { x: string; y: number };

export default function InlineSparkline({ data, className }: { data: Point[]; className?: string }) {
  return (
    <div>
        <ResponsiveContainer>
            <LineChart data={data}>
                <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}
