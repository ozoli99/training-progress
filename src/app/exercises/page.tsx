"use client";

import { Button } from "@/components/ui/button";
import { ExerciseCreateDialog } from "@/components/ExerciseCreateDialog";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Exercise, SortDir } from "@/lib/types";
import { FiltersRow } from "@/components/FiltersRow";
import { ExerciseCard } from "@/components/ExerciseCard";
import { useGetExercises } from "@/components/hooks/api/exercises";
import { sortByName } from "@/lib/sort";

export default function ExercisesPage() {
  const { data = [], isLoading, isError, refetch } = useGetExercises();

  const [q, setQ] = useState("");
  const [unit, setUnit] = useState<Exercise["unit"] | "all">("all");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [open, setOpen] = useState(false);

  const toggleSort = useCallback(
    () => setSortDir((d) => (d === "asc" ? "desc" : "asc")),
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA|SELECT/)) {
        return;
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data
      .filter((x) => (unit === "all" ? true : x.unit === unit))
      .filter((x) => (!needle ? true : x.name.toLowerCase().includes(needle)))
      .sort((a, b) => sortByName(a, b, sortDir));
  }, [data, q, unit, sortDir]);

  return (
    <div className="grid gap-6">
      <FiltersRow
        q={q}
        setQ={setQ}
        unit={unit}
        setUnit={setUnit}
        sortDir={sortDir}
        toggleSort={toggleSort}
        onRefresh={refetch}
        onNew={() => setOpen(true)}
      />
      {isLoading && (
        <div className="grid gap-2">
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
        </div>
      )}
      {isError && (
        <div className="rounded-xl border p-4 text-sm">
          Failed to load exercises.
          <Button
            size="sm"
            variant="link"
            onClick={() => refetch()}
            className="ml-2 p-0 h-auto"
          >
            Try again
          </Button>
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          No exercises found. Adjust filters or{" "}
          <button className="underline" onClick={() => setOpen(true)}>
            create a new one
          </button>
          .
        </div>
      )}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      )}
      <ExerciseCreateDialog open={open} onOpenChange={(o) => setOpen(o)} />
    </div>
  );
}
