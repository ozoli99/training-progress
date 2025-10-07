"use client";

import { Card, CardContent } from "@/components/ui/card";
import { best1RMOf, totalTimeOf, volumeOf } from "@/lib/training";
import { Unit, Log } from "@/lib/types";
import { useMemo } from "react";

type Props = {
  logs: Log[];
  unit: Unit;
};

export function LogsTable({ logs, unit }: Props) {
  const rows = useMemo(
    () =>
      logs
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 12)
        .map((l) => ({
          id: l.id,
          date: l.date,
          vol: volumeOf(l),
          best: best1RMOf(l),
          time: totalTimeOf(l),
        })),
    [logs]
  );

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="[&>th]:py-2 [&>th]:px-3 text-left">
              <th>Date</th>
              {unit !== "time" ? <th>Best Set</th> : <th>Total Time</th>}
              {unit !== "time" && <th>Volume</th>}
              <th className="hidden sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="py-2 px-3 tabular-nums">{row.date}</td>
                {unit !== "time" ? (
                  <td className="py-2 px-3">
                    {Math.round(row.best).toLocaleString()} kg (est. 1RM)
                  </td>
                ) : (
                  <td className="py-2 px-3">{Math.round(row.time / 60)} min</td>
                )}
                {unit !== "time" && (
                  <td className="py-2 px-3">
                    {Math.round(row.vol).toLocaleString()}
                  </td>
                )}
                <td className="py-2 px-3 hidden sm:table-cell text-muted-foreground">
                  —
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
