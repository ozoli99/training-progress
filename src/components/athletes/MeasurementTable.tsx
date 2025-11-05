// components/athletes/MeasurementTable.tsx
"use client";

import * as React from "react";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type Measurement = {
  id: string;
  orgId: string;
  athleteId: string;
  measuredAt: string;
  type: string;
  valueNum: string | null;
  valueJson: Record<string, unknown> | null;
  source: string | null;
  notes: string | null;
};

export default function MeasurementTable({
  athleteId,
  limit = 20,
}: {
  athleteId: string;
  limit?: number;
}) {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Measurement[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: String(limit) });
      const data = await api<Measurement[]>(
        `/api/athletes/${athleteId}/measurements?` + qs.toString()
      );
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load measurements");
    } finally {
      setLoading(false);
    }
  }, [athleteId, limit]);

  React.useEffect(() => {
    if (athleteId) load();
  }, [athleteId, load]);

  if (!athleteId) {
    return (
      <p className="text-sm text-muted-foreground">
        Set an athleteId in the Dev Auth bar above.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">Error: {error}</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Measured At</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">
                {new Date(r.measuredAt).toLocaleString()}
              </TableCell>
              <TableCell className="font-medium">{r.type}</TableCell>
              <TableCell>
                {r.valueNum ??
                  (r.valueJson ? JSON.stringify(r.valueJson) : "—")}
              </TableCell>
              <TableCell>{r.source || "—"}</TableCell>
              <TableCell className="max-w-[360px] truncate">
                {r.notes || "—"}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-sm text-muted-foreground"
              >
                No measurements yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
