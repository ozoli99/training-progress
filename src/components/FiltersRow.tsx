"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIT_FILTERS } from "@/lib/constants";
import { SortDir, Unit } from "@/lib/types";
import { ArrowUpDown, Plus } from "lucide-react";

type Props = {
  q: string;
  setQ: (v: string) => void;
  unit: Unit | "all";
  setUnit: (v: Unit | "all") => void;
  sortDir: SortDir;
  toggleSort: () => void;
  onRefresh: () => void;
  onNew: () => void;
};

export function FiltersRow({
  q,
  setQ,
  unit,
  setUnit,
  sortDir,
  toggleSort,
  onRefresh,
  onNew,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Exercises</h2>
          <p className="text-sm text-muted-foreground">
            Create, filter, and open exercises. Press{" "}
            <kbd className="px-1 py-0.5 rounded border text-xs">N</kbd> to add
            quickly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onNew}>
            <Plus className="mr-2 h-4 w-4" /> New Exercise
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            placeholder="Back Squat..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <Label>Unit</Label>
          <Select
            value={unit}
            onValueChange={(v) => setUnit(v as Unit | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="All units" />
            </SelectTrigger>
            <SelectContent>
              {UNIT_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="self-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={toggleSort}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort {sortDir === "asc" ? "A→Z" : "Z→A"}
          </Button>
        </div>
      </div>
    </>
  );
}
