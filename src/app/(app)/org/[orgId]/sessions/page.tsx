"use client";

import * as React from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SessionItem = {
  id: string;
  athleteId: string;
  athleteName?: string;
  sessionDate: string; // ISO date
  title?: string | null;
  status?: string | null;
  completionPct?: number | null;
};

type SessionsResponse = {
  total?: number;
  items: SessionItem[];
};

const PAGE_SIZE = 10;

function useQueryState() {
  const sp = useSearchParams();
  const [from, setFrom] = React.useState<string>(sp.get("from") ?? "");
  const [to, setTo] = React.useState<string>(sp.get("to") ?? "");
  const [status, setStatus] = React.useState<string>(sp.get("status") ?? "all");
  const [q, setQ] = React.useState<string>(sp.get("q") ?? "");
  const [page, setPage] = React.useState<number>(Number(sp.get("page") ?? "1"));

  React.useEffect(() => {
    // keep page in range when filters change
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, status, q]);

  return {
    from,
    setFrom,
    to,
    setTo,
    status,
    setStatus,
    q,
    setQ,
    page,
    setPage,
  };
}

function StatusPill({ code }: { code?: string | null }) {
  const c = (code ?? "").toLowerCase();
  const map: Record<string, string> = {
    planned: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
    in_progress:
      "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
    completed:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
    skipped: "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200",
  };
  const cls = map[c] ?? "bg-muted text-foreground/80";
  return <Badge className={`capitalize ${cls}`}>{c || "unknown"}</Badge>;
}

export default function SessionsPage() {
  const router = useRouter();
  const { orgId } = useParams<{ orgId: string }>();
  const {
    from,
    setFrom,
    to,
    setTo,
    status,
    setStatus,
    q,
    setQ,
    page,
    setPage,
  } = useQueryState();

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<SessionItem[]>([]);
  const [total, setTotal] = React.useState<number | undefined>(undefined);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String((page - 1) * PAGE_SIZE));
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q) params.set("q", q);
      // The analytics/sessions route in your project reads range+pagination.
      // If it accepts a status filter, pass it; otherwise this is harmless.
      if (status && status !== "all") params.set("status", status);

      const res = await fetch(
        `/api/orgs/${orgId}/analytics/sessions?` + params.toString(),
        {
          method: "GET",
          headers: { "cache-control": "no-store" },
        }
      );
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Failed: ${res.status} ${msg}`);
      }
      const json = (await res.json()) as SessionsResponse;
      setRows(json.items ?? []);
      setTotal(json.total);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(undefined);
    } finally {
      setLoading(false);
    }
  }, [orgId, from, to, q, status, page]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const canPrev = page > 1;
  const canNext =
    total !== undefined ? page * PAGE_SIZE < total : rows.length === PAGE_SIZE;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Plan, track and review training sessions across your organization.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/org/${orgId}/sessions/new`)}>
            Plan session
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/org/${orgId}/log`)}
          >
            Log workout
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">From</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">To</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">
              Search (athlete, title)
            </label>
            <Input
              placeholder="e.g., “Front squat”, “Anna Kovács”"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={() => {
                setPage(1);
                fetchList();
              }}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFrom("");
                setTo("");
                setStatus("all");
                setQ("");
                setPage(1);
                fetchList();
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {total !== undefined ? `Results (${total})` : "Results"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-xl font-medium">No sessions found</div>
              <p className="text-sm text-muted-foreground">
                Try adjusting the filters or create a new planned session.
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => router.push(`/org/${orgId}/sessions/new`)}
                >
                  Plan your first session
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[140px]">Completion</TableHead>
                    <TableHead className="w-[110px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => {
                    const d = new Date(s.sessionDate);
                    const dateStr = isNaN(d.getTime())
                      ? s.sessionDate
                      : d.toLocaleDateString();
                    const completion = s.completionPct ?? null;
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{dateStr}</TableCell>
                        <TableCell className="truncate">
                          {s.athleteName ?? "—"}
                        </TableCell>
                        <TableCell className="truncate">
                          {s.title ?? "Session"}
                        </TableCell>
                        <TableCell>
                          <StatusPill code={s.status} />
                        </TableCell>
                        <TableCell>
                          {completion !== null && completion !== undefined
                            ? `${Math.round(Number(completion))}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              router.push(`/org/${orgId}/sessions/${s.id}`)
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Page {page}
                  {total !== undefined
                    ? ` of ${Math.max(1, Math.ceil(total / PAGE_SIZE))}`
                    : ""}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => canPrev && setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNext}
                    onClick={() => canNext && setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
