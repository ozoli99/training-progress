"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Dumbbell, Plus } from "lucide-react";

type ExerciseRow = {
  id: string;
  name: string;
  category?: string | null;
  modality?: string | null;
  movementGroups?: string[];
  globalExerciseId?: string | null;
  createdAt?: string;
};

type ListResponse = {
  total?: number;
  items: ExerciseRow[];
  facets?: {
    categories?: string[];
    modalities?: string[];
  };
};

const PAGE_SIZE = 20;

function useQueryState() {
  const sp = useSearchParams();
  const [q, setQ] = React.useState(sp.get("q") ?? "");
  const [category, setCategory] = React.useState(sp.get("category") ?? "all");
  const [modality, setModality] = React.useState(sp.get("modality") ?? "all");
  const [page, setPage] = React.useState<number>(Number(sp.get("page") ?? "1"));

  React.useEffect(() => {
    setPage(1);
  }, [q, category, modality]);

  return {
    q,
    setQ,
    category,
    setCategory,
    modality,
    setModality,
    page,
    setPage,
  };
}

export default function OrgExercisesPage() {
  const router = useRouter();
  const { orgId } = useParams<{ orgId: string }>();
  const {
    q,
    setQ,
    category,
    setCategory,
    modality,
    setModality,
    page,
    setPage,
  } = useQueryState();

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<ExerciseRow[]>([]);
  const [total, setTotal] = React.useState<number | undefined>(undefined);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [modalities, setModalities] = React.useState<string[]>([]);

  const canPrev = page > 1;
  const canNext =
    total !== undefined ? page * PAGE_SIZE < total : rows.length === PAGE_SIZE;

  const qDebounceRef = React.useRef<number | null>(null);
  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => setQDebounced(q), 300);
    return () => {
      if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    };
  }, [q]);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String((page - 1) * PAGE_SIZE));
      if (qDebounced) params.set("q", qDebounced);
      if (category && category !== "all") params.set("category", category);
      if (modality && modality !== "all") params.set("modality", modality);

      const res = await fetch(
        `/api/orgs/${orgId}/exercises?` + params.toString(),
        { headers: { "cache-control": "no-store" } }
      );
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Failed to load exercises: ${res.status} ${msg}`);
      }
      const json = (await res.json()) as ListResponse;

      setRows(json.items ?? []);
      setTotal(json.total);

      const cats =
        json.facets?.categories ??
        Array.from(
          new Set(
            (json.items ?? [])
              .map((i) => (i.category ?? "").trim())
              .filter(Boolean)
          )
        );
      const mods =
        json.facets?.modalities ??
        Array.from(
          new Set(
            (json.items ?? [])
              .map((i) => (i.modality ?? "").trim())
              .filter(Boolean)
          )
        );
      setCategories(cats);
      setModalities(mods);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(undefined);
    } finally {
      setLoading(false);
    }
  }, [orgId, qDebounced, category, modality, page]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border">
            <Dumbbell className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Exercises</h1>
            <p className="text-sm text-muted-foreground">
              Browse and manage your organization’s exercise library.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/org/${orgId}/exercises/new`}
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New exercise
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Search</label>
            <Input
              placeholder="Search by name, category, modality…"
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Modality</label>
            <Select value={modality} onValueChange={(v) => setModality(v)}>
              <SelectTrigger>
                <SelectValue placeholder="All modalities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {modalities.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={() => {
                fetchList();
              }}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setQ("");
                setCategory("all");
                setModality("all");
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
              <div className="text-xl font-medium">No exercises found</div>
              <p className="text-sm text-muted-foreground">
                Try adjusting filters or create a new exercise.
              </p>
              <div className="mt-4">
                <Link
                  href={`/org/${orgId}/exercises/new`}
                  className={cn(buttonVariants(), "gap-2")}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Create exercise
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[38%]">Name</TableHead>
                    <TableHead className="w-[18%]">Category</TableHead>
                    <TableHead className="w-[18%]">Modality</TableHead>
                    <TableHead>Movement groups</TableHead>
                    <TableHead className="w-[110px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((ex) => (
                    <TableRow key={ex.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/org/${orgId}/exercises/${ex.id}`}
                          className="hover:underline"
                        >
                          {ex.name}
                        </Link>
                        {ex.globalExerciseId && (
                          <span className="ml-2 rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            linked
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="truncate">
                        {ex.category ?? "—"}
                      </TableCell>
                      <TableCell className="truncate">
                        {ex.modality ?? "—"}
                      </TableCell>
                      <TableCell className="truncate">
                        {(ex.movementGroups ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ex.movementGroups!.map((g) => (
                              <Badge
                                key={g}
                                variant="secondary"
                                className="text-xs"
                              >
                                {g}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/org/${orgId}/exercises/${ex.id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" })
                          )}
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Page {page}
                  {total !== undefined
                    ? ` of ${Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))}`
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
