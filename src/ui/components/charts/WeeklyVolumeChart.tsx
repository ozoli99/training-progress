"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { week: string; volume: number };

export function WeeklyVolumeChart({ data, height = 288, unit = "kg·reps" }: { data: Point[]; height?: number; unit?: string }) {
    const gradId = React.useId();

    const prevMap = React.useMemo(() => {
        const map = new Map<string, number>();
        for (let i = 1; i < data.length; i++) {
            map.set(data[i].week, data[i - 1].volume);
        }
        return map;
    }, [data]);

    const tickFmt = (iso: string) => {
        const d = new Date(iso + "T00:00:00");
        return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    };

    const num = (n: number) => n.toLocaleString();

    return (
        <div style={{ height }} className="w-full">
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                    barCategoryGap={18}
                >
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-muted" />
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
                        tickFormatter={v => num(v)}
                        tickLine={false}
                        axisLine={false}
                        className="text-xs fill-muted-foreground"
                    />
                    <Tooltip
                        cursor={false}
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) {
                                return null;
                            }
                            const v = Number(payload[0].value ?? 0);
                            const prev = prevMap.get(String(label)) ?? 0;
                            const delta = v - prev;
                            const up = delta >= 0;
                            return (
                                <div className="rounded-lg border bg-popover text-popover-foreground p-3 shadow-md">
                                    <div className="text-xs text-muted-foreground">
                                        Week of {tickFmt(String(label))}
                                    </div>
                                    <div className="mt-1 text-sm font-medium">
                                        {num(v)} <span>{unit}</span>
                                    </div>
                                    <div className="mt-1 text-xs">
                                        <span className={up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                            {up ? "▲" : "▼"} {num(Math.abs(delta))}
                                        </span>{" "}
                                        vs prev week
                                    </div>
                                </div>
                            );
                        }}
                    />
                    <Bar
                        dataKey="volume"
                        fill={`url(#${gradId})`}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}