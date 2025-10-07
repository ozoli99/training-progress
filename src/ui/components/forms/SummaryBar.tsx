"use client";

import { Unit } from "@/lib/types";

type Props = {
  unit: Unit;
  volume: number;
  best1RM: number;
  totalSecs: number;
  autosavedAt: number | null;
};

export function SummaryBar({
  unit,
  volume,
  best1RM,
  totalSecs,
  autosavedAt,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-muted-foreground">
        {unit === "weight_reps"
          ? "This exercise tracks weight × reps."
          : unit === "reps"
            ? "This exercise tracks reps only."
            : "This exercise tracks time (seconds)."}
      </span>
      <span className="hidden sm:inline text-muted-foreground">•</span>
      <span className="text-muted-foreground">
        <strong>Summary:</strong>{" "}
        {unit === "time"
          ? `${totalSecs} sec total`
          : `Volume ${Math.round(volume)}${unit === "reps" ? " reps" : ""}${
              unit === "weight_reps" ? ` · est. 1RM ${Math.round(best1RM)}` : ""
            }`}
      </span>
      {autosavedAt && (
        <>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Autosaved {new Date(autosavedAt).toLocaleTimeString()}
          </span>
        </>
      )}
    </div>
  );
}
