"use client";

import * as React from "react";
import { ReferenceLine, ReferenceDot } from "recharts";

import dynamic from "next/dynamic";
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });

type Unit = "weight_reps" | "time" | "reps";

export function TrendChart({
    series,
    metric,
    unit,
    height = 288,
    showAverage = true,
    emphasizePR = true,
}: {
    series: { x: string; y: number }[];
    metric: "volume" | "one_rm";
    unit: Unit;
    height?: number;
    showAverage?: boolean;
    emphasizePR?: boolean;
}) {
    console.log(unit)
    const isBar = metric === "volume";
    const gradId = React.useId();
    const lineGradId = React.useId();
    const tickFmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "2-digit" });

    const yVals = series.map((p) => Number(p.y)).filter(Number.isFinite);
    const minY = yVals.length ? Math.min(...yVals) : 0;
    const maxY = yVals.length ? Math.max(...yVals) : 0;
    const range = maxY - minY;
    const pad = range === 0 ? Math.max(1, maxY * 0.1 || 1) : range * 0.1;

    const avg = yVals.length ? yVals.reduce((a, b) => a + b, 0) / yVals.length : 0;
    const pr = yVals.length ? Math.max(...yVals) : 0;
    const prIdx = pr > 0 ? series.findIndex((p) => p.y === pr) : -1;
    const prPoint = prIdx >= 0 ? series[prIdx] : null;

    const prevMap = React.useMemo(() => {
        const map = new Map<string, number>();
        for (let i = 1; i < series.length; i++) {
            map.set(series[i].x, series[i - 1].y);
        }
        return map;
    }, [series]);

    const yDomain: [any, any] = [
        () => Math.max(0, Math.floor(minY - pad)),
        () => Math.ceil(maxY + pad),
    ];

    return (
        <div
            style={{ height, color: "hsl(var(--primary))" }}
            className="w-full"
            aria-label={metric === "one_rm" ? "Estimated 1RM trend" : unit === "time" ? "Total time trend" : "Volume trend"}
        >
            <ResponsiveContainer>
                {/* extract the 2 charts into separate components */}
                {isBar ? (
                    <BarChart
                        data={series}
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
                            dataKey="x"
                            tickFormatter={tickFmt}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={12}
                            interval="preserveStartEnd"
                            className="text-xs fill-muted-foreground"
                        />
                        <YAxis
                            width={48}
                            tickLine={false}
                            axisLine={false}
                            domain={yDomain}
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
                                        <div className="text-xs text-muted-foreground">Week of {tickFmt(String(label))}</div>
                                        <div className="mt-1 text-sm font-medium">
                                            {Math.round(v).toLocaleString()} <span>{unit === "time" ? "sec" : "kg·reps"}</span>
                                        </div>
                                        <div className="mt-1 text-xs">
                                            <span className={up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                                {up ? "▲" : "▼"} {Math.abs(Math.round(delta)).toLocaleString()}
                                            </span>{" "}
                                            vs prev week
                                        </div>
                                    </div>
                                );
                            }}
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
                        <Bar dataKey="y" fill={`url(#${gradId})`} radius={[6, 6, 0, 0]} maxBarSize={32} />
                    </BarChart>
                ) : (
                    <LineChart
                        data={series}
                        margin={{ top: 8, right: 64, bottom: 0, left: 8 }}
                    >
                        <defs>
                            <linearGradient id={lineGradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
                                <stop offset="100%" stopColor="currentColor" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
                        <XAxis
                            dataKey="x"
                            tickFormatter={tickFmt}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={12}
                            interval="preserveStartEnd"
                            className="text-xs fill-muted-foreground"
                        />
                        <YAxis
                            width={48}
                            tickLine={false}
                            axisLine={false}
                            domain={yDomain}
                            className="text-xs fill-muted-foreground"
                        />
                        <Tooltip
                            cursor={false}
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) {
                                    return null;
                                }
                                const v = Number(payload[0].value ?? 0);
                                const prev = prevMap.get(String(label)) ?? v;
                                const delta = v - prev;
                                const up = delta >= 0;
                                return (
                                    <div className="rounded-lg border bg-popover text-popover-foreground p-3 shadow-md">
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(String(label) + "T00:00:00").toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "2-digit",
                                                year: "numeric",
                                            })}
                                        </div>
                                        <div className="mt-1 text-sm font-medium">
                                            {Math.round(v).toLocaleString()} <span className="text-muted-foreground">{unit === "time" ? "sec" : "kg·reps"}</span>
                                        </div>
                                        <div className="mt-1 text-xs">
                                            {/* todo: swap colors for unit time */}
                                            <span className={up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                                {up ? "▲" : "▼"} {Math.abs(Math.round(delta)).toLocaleString()}
                                            </span>{" "}
                                            vs prev
                                        </div>
                                    </div>
                                );
                            }}
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

                        <Area type="monotone" dataKey="y" stroke="transparent" fill={`url(#${lineGradId})`} isAnimationActive={false} />
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
                )}
            </ResponsiveContainer>
        </div>
    );
}