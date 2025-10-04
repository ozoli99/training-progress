"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as React from "react";

export function WeeklyVolumeChart({ data }: { data: { week: string; volume: number }[] }) {
    return (
        <div>
            <ResponsiveContainer>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}